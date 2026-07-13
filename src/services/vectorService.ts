import type { Repository, VectorRecord, EmbeddingConfig } from '../types';

/**
 * 向量服务 -- 本地向量索引与语义搜索
 * 利用 utools.db 分片存储向量，JS 端 brute-force cosine 相似度
 */

/** 计算余弦相似度 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * 构建嵌入文本（参考 GithubStarsManager 的 buildEmbeddingText）
 * 拼接仓库的关键信息作为嵌入上下文
 */
function buildEmbeddingText(repo: Repository): string {
    const parts: string[] = [];
    parts.push(`仓库: ${repo.fullName}`);
    if (repo.description) parts.push(`描述: ${repo.description}`);
    if (repo.aiSummary) parts.push(`摘要: ${repo.aiSummary}`);
    if (repo.language) parts.push(`语言: ${repo.language}`);
    if (repo.topics && repo.topics.length > 0) parts.push(`主题: ${repo.topics.join(', ')}`);
    // 维度标签
    if (repo.dimensionTags) {
        const tagStrs: string[] = [];
        for (const [dimId, optIds] of Object.entries(repo.dimensionTags)) {
            tagStrs.push(`${dimId}:${optIds.join(',')}`);
        }
        if (tagStrs.length > 0) parts.push(`标签: ${tagStrs.join('; ')}`);
    }
    return parts.join('\n');
}

export const vectorService = {
    /**
     * 全量重建向量索引
     * 对所有已分析仓库重新嵌入，覆盖旧索引
     */
    async buildIndex(
        repos: Repository[],
        config: EmbeddingConfig,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ success: number; failed: number }> {
        // 只索引有 aiSummary 的仓库（已分析过的）
        const toIndex = repos.filter(r => r.analyzedAt && !r.analysisFailed);
        const vectors: VectorRecord[] = [];
        let success = 0, failed = 0;

        for (let i = 0; i < toIndex.length; i++) {
            const repo = toIndex[i];
            try {
                const text = buildEmbeddingText(repo);
                const vector = await window.githubStarsAPI.getEmbedding(text, config);
                vectors.push({
                    repoId: repo.id,
                    vector,
                    fullName: repo.fullName,
                    indexedAt: new Date().toISOString(),
                });
                success++;
            } catch (error) {
                console.error(`[VectorService] 索引失败 ${repo.fullName}:`, error);
                failed++;
            }
            onProgress?.(i + 1, toIndex.length);
        }

        // 保存到分片存储
        window.githubStarsAPI.saveVectors(vectors);
        return { success, failed };
    },

    /**
     * 增量索引 -- 只对新增/变化的仓库嵌入，追加到现有索引
     */
    async incrementalIndex(
        repos: Repository[],
        config: EmbeddingConfig,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ success: number; failed: number; skipped: number }> {
        const existing = window.githubStarsAPI.loadVectors();
        const existingMap = new Map(existing.map(v => [v.repoId, v]));

        // 找出需要更新的：analyzedAt 存在但 vectorIndexedAt 早于 analyzedAt，或无向量
        const toIndex = repos.filter(r => {
            if (!r.analyzedAt || r.analysisFailed) return false;
            const existingVec = existingMap.get(r.id);
            if (!existingVec) return true; // 无向量
            return new Date(r.vectorIndexedAt || '').getTime() < new Date(r.analyzedAt).getTime();
        });

        if (toIndex.length === 0) {
            return { success: 0, failed: 0, skipped: repos.length };
        }

        let success = 0, failed = 0;
        for (let i = 0; i < toIndex.length; i++) {
            const repo = toIndex[i];
            try {
                const text = buildEmbeddingText(repo);
                const vector = await window.githubStarsAPI.getEmbedding(text, config);
                existingMap.set(repo.id, {
                    repoId: repo.id,
                    vector,
                    fullName: repo.fullName,
                    indexedAt: new Date().toISOString(),
                });
                success++;
            } catch (error) {
                console.error(`[VectorService] 增量索引失败 ${repo.fullName}:`, error);
                failed++;
            }
            onProgress?.(i + 1, toIndex.length);
        }

        // 保存全部向量（含更新的）
        window.githubStarsAPI.saveVectors(Array.from(existingMap.values()));
        return { success, failed, skipped: repos.length - toIndex.length };
    },

    /**
     * 语义搜索 -- 对查询文本嵌入，与候选仓库向量算 cosine 相似度
     * @param queryText 查询文本
     * @param candidateRepos 候选仓库列表（全部或视图子集）
     * @param config embedding 配置
     * @returns 按相似度降序排列的 { repoId, score }[]
     */
    async search(
        queryText: string,
        candidateRepos: Repository[],
        config: EmbeddingConfig
    ): Promise<Array<{ repoId: number; score: number }>> {
        if (candidateRepos.length === 0) return [];

        // 获取查询向量
        const queryVector = await window.githubStarsAPI.getEmbedding(queryText, config);

        // 加载全部向量，筛选出候选仓库的向量
        const allVectors = window.githubStarsAPI.loadVectors();
        const candidateIds = new Set(candidateRepos.map(r => r.id));
        const candidateVectors = allVectors.filter(v => candidateIds.has(v.repoId));

        if (candidateVectors.length === 0) return [];

        // 计算相似度并排序
        const results = candidateVectors.map(v => ({
            repoId: v.repoId,
            score: cosineSimilarity(queryVector, v.vector),
        }));

        results.sort((a, b) => b.score - a.score);

        // 返回 Top 50，过滤极低分（<0.1）
        return results.filter(r => r.score > 0.1).slice(0, 50);
    },

    /** 获取索引状态 */
    getIndexStatus(): { indexed: number; total: number } {
        const meta = window.githubStarsAPI.getVectorMeta();
        const repos = window.githubStarsAPI.getRepos();
        const analyzed = repos.filter(r => r.analyzedAt && !r.analysisFailed).length;
        return {
            indexed: meta?.count || 0,
            total: analyzed,
        };
    },

    /** 清除索引 */
    clearIndex(): void {
        window.githubStarsAPI.removeVectors();
    },
};
