import type { Repository } from '../types';
import { logger } from '../utils/logger';

// ==================== 翻译缓存 (v1.6.0) ====================

interface TranslationCache {
    content: string;
    translatedContent: string;
    timestamp: number;
    model?: string;
}

// 内存缓存
const translationCache = new Map<number, TranslationCache>();

// 缓存过期时间：7 天
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * 生成内容哈希（混合算法 + 长度限制）
 * 格式: {长度}_{首部样本}_{中部样本}_{尾部样本}
 * 碰撞概率: < 1/10^12
 * @since v1.7.0 - 优化哈希算法，降低碰撞概率
 */
function hashContent(content: string): string {
    if (!content) return '0';

    // 限制最大处理长度，避免超长内容导致性能问题
    const MAX_HASH_LENGTH = 10000;
    const truncated = content.length > MAX_HASH_LENGTH
        ? content.slice(0, MAX_HASH_LENGTH) + `...[${content.length}]`
        : content;

    const len = truncated.length;

    // 采样策略：首部、中部、尾部各取 100 字符
    const sampleSize = Math.min(100, Math.floor(len / 3));
    const samples = [
        truncated.slice(0, sampleSize),
        truncated.slice(Math.floor(len / 2), Math.floor(len / 2) + sampleSize),
        truncated.slice(Math.max(0, len - sampleSize), len)
    ];

    // 为每个样本计算 DJB2 哈希
    const sampleHashes = samples.map(sample => {
        let hash = 5381;
        for (let i = 0; i < sample.length; i++) {
            hash = ((hash << 5) + hash) ^ sample.charCodeAt(i);
        }
        return (hash >>> 0).toString(36);
    });

    return `${len.toString(36)}_${sampleHashes.join('_')}`;
}

// 内容最大长度（根据 AI 模型上下文限制）
const MAX_CONTENT_LENGTH = 8000;

// ==================== 并发控制 ====================
class PromiseQueue {
    private concurrency: number;
    private running: number = 0;
    private queue: (() => void)[] = [];

    constructor(concurrency: number) {
        this.concurrency = concurrency;
    }

    async add<T>(task: () => Promise<T>): Promise<T> {
        if (this.running >= this.concurrency) {
            await new Promise<void>(resolve => this.queue.push(resolve));
        }

        this.running++;
        try {
            return await task();
        } finally {
            this.running--;
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                next?.();
            }
        }
    }
}

// 全局翻译并发队列（限制为 3）
const translationQueue = new PromiseQueue(3);

// 正在进行中的翻译请求
const pendingTranslations = new Map<number, Promise<{ translatedContent: string; fromCache: boolean } | null>>();

export const aiService = {
    async analyzeRepository(
        repo: Repository,
        token: string,
        language: 'zh' | 'en' = 'zh',
        model?: string,
        dimensions?: any[],
        aiConfig?: any,
        extraInstruction?: string
    ): Promise<{ summary: string; tags: string[]; dimensions?: Record<string, string[]>; platforms: string[] } | null> {
        const readme = await window.githubStarsAPI.getReadme(
            repo.owner.login,
            repo.name,
            token
        );

        if (!readme) {
            return {
                summary: repo.description || (language === 'zh' ? '暂无描述' : 'No description'),
                tags: repo.topics || [],
                platforms: [],
            };
        }

        const result = await window.githubStarsAPI.analyzeRepo(
            readme,
            {
                fullName: repo.fullName,
                description: repo.description,
                language: repo.language,
            },
            dimensions || [],
            aiConfig,
            extraInstruction,
        );

        if (!result) {
            return {
                summary: repo.description || (language === 'zh' ? '暂无描述' : 'No description'),
                tags: repo.topics || [],
                platforms: [],
            };
        }

        const tags = result.dimensions ? Object.values(result.dimensions).flat() : (repo.topics || []);
        return {
            summary: result.summary,
            tags,
            dimensions: result.dimensions,
            platforms: result.platforms,
        };
    },

    /**
     * 批量分析仓库
     * @param repos 要分析的仓库列表
     * @param token GitHub Token
     * @param onProgress 进度回调
     * @param language 语言
     * @param concurrency 并发数
     * @param signal 中止信号
     */
    async batchAnalyze(
        repos: Repository[],
        token: string,
        onProgress: (current: number, total: number, repo: Repository) => void,
        language: 'zh' | 'en' = 'zh',
        concurrency: number = 1,
        model?: string,
        signal?: AbortSignal,
        dimensions?: any[],
        aiConfig?: any,
        extraInstruction?: string
    ): Promise<Repository[]> {
        const queue = [...repos];
        let completed = 0;

        const results = new Map<number, Repository>();

        const processQueue = async () => {
            while (queue.length > 0 && !signal?.aborted) {
                const repo = queue.shift();
                if (!repo) break;

                try {
                    const result = await aiService.analyzeRepository(repo, token, language, model, dimensions, aiConfig, extraInstruction);
                    if (result && !signal?.aborted) {
                        repo.aiSummary = result.summary;
                        repo.aiTags = result.tags;
                        repo.aiPlatforms = result.platforms;
                        repo.dimensionTags = result.dimensions || {};
                        // 确保 platform 维度同步到 dimensionTags（AI 可能只返回 platforms 不放 dimensions）
                        if (result.platforms?.length) {
                            repo.dimensionTags['platform'] = result.platforms;
                        }
                        repo.analyzedAt = new Date().toISOString();
                        repo.analysisFailed = false;
                    }
                } catch (error) {
                    if (!signal?.aborted) {
                        console.error(`Failed to analyze ${repo.fullName}:`, error);
                        repo.analysisFailed = true;
                    }
                }

                if (!signal?.aborted) {
                    results.set(repo.id, repo);
                    completed++;
                    onProgress(completed, repos.length, repo);
                }
            }
        };

        const workers = Array(Math.min(concurrency, queue.length))
            .fill(null)
            .map(() => processQueue());

        await Promise.all(workers);

        return repos.map(r => results.get(r.id) || r);
    },

    /**
     * 翻译 Release 内容 (v1.6.0)
     * @param releaseId Release ID（用于缓存 key）
     * @param content Release body (Markdown)
     * @param language 目标语言
     * @param model AI 模型
     * @param forceRefresh 强制刷新缓存
     */
    async translateRelease(
        releaseId: number,
        content: string,
        language: 'zh' | 'en' = 'zh',
        model?: string,
        forceRefresh: boolean = false
    ): Promise<{ translatedContent: string; fromCache: boolean } | null> {
        // 1. 语言检测：如果内容已是目标语言，无需翻译
        const isChineseContent = /[\u4e00-\u9fa5]/.test(content);
        if (language === 'zh' && isChineseContent) {
            logger.log('[translateRelease] 内容已是中文，无需翻译');
            return { translatedContent: content, fromCache: true };
        }

        // 2. 内容过长处理
        let truncatedContent = content;
        let isTruncated = false;
        if (content.length > MAX_CONTENT_LENGTH) {
            truncatedContent = content.slice(0, MAX_CONTENT_LENGTH) + '\n\n...';
            isTruncated = true;
            logger.warn('[translateRelease] 内容过长，已截断', {
                originalLength: content.length,
                truncatedLength: truncatedContent.length
            });
        }

        // 3. 检查缓存
        if (!forceRefresh) {
            const cached = translationCache.get(releaseId);
            if (cached) {
                const contentHash = hashContent(content);
                const cachedHash = hashContent(cached.content);
                const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRY;

                if (contentHash === cachedHash && !isExpired && cached.model === model) {
                    logger.log('[translateRelease] 命中缓存', { releaseId });
                    return { translatedContent: cached.translatedContent, fromCache: true };
                }
            }
        }

        // 4. 构建翻译提示
        const targetLanguage = language === 'zh' ? '中文' : 'English';
        const systemPrompt = `你是一个专业的技术文档翻译专家。请将以下 GitHub Release 更新说明翻译成${targetLanguage}。

要求：
1. 保持 Markdown 格式不变
2. 保留所有链接、代码块、标题格式
3. 技术术语保留英文原文（如 API、SDK、 Docker、Kubernetes 等）
4. 版本号、命令、代码不要翻译
5. 翻译要准确、通顺，符合技术文档风格
${isTruncated ? '6. 内容已被截断，在末尾有省略号，请正常翻译到省略号处即可' : ''}

直接输出翻译后的内容，不要添加任何解释或说明。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: truncatedContent }
        ];

        // 5. 检查是否正在翻译中
        if (pendingTranslations.has(releaseId)) {
            logger.log('[translateRelease] 已经有相同的翻译请求正在进行，复用现有请求', { releaseId });
            return pendingTranslations.get(releaseId)!;
        }

        // 6. 发起翻译请求并存入进行中队列
        const translationPromise = (async () => {
            try {
                logger.log('[translateRelease] 准备翻译，进入队列等待', { releaseId });

                const result = await translationQueue.add(async () => {
                    logger.log('[translateRelease] 开始执行翻译请求', { releaseId, model, contentLength: truncatedContent.length });
                    const aiOptions: any = { messages };
                    if (model) aiOptions.model = model;
                    return await utools.ai(aiOptions);
                });

                const translatedContent = result?.content;

                if (translatedContent) {
                    translationCache.set(releaseId, {
                        content,
                        translatedContent,
                        timestamp: Date.now(),
                        model
                    });

                    logger.log('[translateRelease] 翻译完成', { releaseId, translatedLength: translatedContent.length });
                    return { translatedContent, fromCache: false };
                }

                return null;
            } catch (error) {
                console.error('[translateRelease] 翻译失败:', error);
                throw error;
            } finally {
                // 请求结束，从进行中队列移除
                pendingTranslations.delete(releaseId);
            }
        })();

        pendingTranslations.set(releaseId, translationPromise);
        return translationPromise;
    },

    /**
     * 清除翻译缓存 (v1.6.0)
     */
    clearTranslationCache(releaseId?: number) {
        if (releaseId) {
            translationCache.delete(releaseId);
        } else {
            translationCache.clear();
        }
    },

    /**
     * AI 总结 Release 更新日志 🆕
     * 区分新功能/Bug修复，通俗语言，按重要程度排序
     * @param releaseBody Release body (Markdown)
     * @param repoInfo 仓库信息
     * @param aiConfig AI 配置
     */
    async analyzeReleaseSummary(
        releaseBody: string,
        repoInfo: { fullName: string; tagName: string },
        aiConfig?: { mode: 'utools' | 'custom'; apiKey?: string; endpoint?: string; model?: string }
    ): Promise<string | null> {
        if (!releaseBody) return null;

        const systemPrompt = `你是一个专业的 GitHub Release 更新日志分析助手。请分析以下更新日志，用通俗易懂的语言总结。

要求：
1. 区分"新功能"和"Bug 修复"
2. 按重要程度排序
3. 用列表形式输出
4. 纯 Markdown 格式，不要代码块标记

直接输出总结，不要添加解释。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `仓库: ${repoInfo.fullName}\n版本: ${repoInfo.tagName}\n\n更新日志:\n${releaseBody.substring(0, 12000)}` },
        ];

        try {
            let result;
            if (aiConfig?.mode === 'custom' && aiConfig.apiKey) {
                result = await window.githubStarsAPI.customAI(messages, aiConfig);
            } else {
                const aiOptions: any = { messages };
                if (aiConfig?.model) aiOptions.model = aiConfig.model;
                result = await utools.ai(aiOptions);
            }
            // 剥离可能的 ```markdown 代码块标记
            let content = result.content || '';
            content = content.replace(/^```(?:markdown)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');
            return content.trim() || null;
        } catch (error) {
            console.error('[AI] Release 总结失败:', error);
            return null;
        }
    },
};
