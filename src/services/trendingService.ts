import type { Repository, FocusPoint, AIConfig } from '../types';

/**
 * 趋势服务 -- GitHub Search API + AI 匹配关注重点
 */

export interface TrendingFilters {
    language?: string;       // 编程语言（如 python）
    minStars?: number;       // 最低 Star 数
    createdSince?: string;   // 创建时间下限（YYYY-MM-DD）
    perPage?: number;        // 每页数量
}

export interface TrendingRepo extends Repository {
    matchReason?: string;    // AI 匹配关注点的理由
    matchedFocus?: string;   // 匹配的关注重点内容
}

export const trendingService = {
    /**
     * 拉取趋势仓库（GitHub Search API）
     * 查询格式: created:>$date sort=stars
     */
    async fetchTrending(
        filters: TrendingFilters,
        token: string
    ): Promise<{ repos: Repository[]; totalCount: number }> {
        const parts: string[] = [];

        if (filters.language) {
            parts.push(`language:${filters.language}`);
        }
        if (filters.minStars) {
            parts.push(`stars:>=${filters.minStars}`);
        }
        if (filters.createdSince) {
            parts.push(`created:>=${filters.createdSince}`);
        }

        const query = parts.length > 0 ? parts.join(' ') : 'stars:>=100';
        const result = await window.githubStarsAPI.searchRepos(query, token, 1, filters.perPage || 30);

        const repos: Repository[] = (result.items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            fullName: item.full_name,
            owner: {
                login: item.owner?.login || '',
                avatarUrl: item.owner?.avatar_url || '',
            },
            description: item.description,
            homepage: item.homepage || '',
            htmlUrl: item.html_url,
            language: item.language,
            topics: item.topics || [],
            stargazersCount: item.stargazers_count || 0,
            forksCount: item.forks_count || 0,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            pushedAt: item.pushed_at,
            customTags: [],
            lastSyncedAt: Date.now(),
        }));

        return { repos, totalCount: result.total_count || 0 };
    },

    /**
     * AI 匹配关注重点
     * 对趋势仓库逐个判断是否匹配用户的关注重点
     */
    async matchWithFocusPoints(
        repos: Repository[],
        focusPoints: FocusPoint[],
        aiConfig?: AIConfig
    ): Promise<TrendingRepo[]> {
        if (focusPoints.length === 0) {
            return repos;
        }

        const focusText = focusPoints.map(f => f.content).join('、');
        const systemPrompt = `你是一个项目匹配专家。用户关注以下重点：${focusText}

请判断以下仓库是否与用户的关注重点匹配。如果匹配，返回匹配理由；如果不匹配，返回空。

请以 JSON 数组格式返回：
[{"fullName": "仓库全名", "matched": true/false, "reason": "匹配理由（匹配时填写）", "focus": "匹配的关注重点"}]

只返回 JSON，不要其他内容。`;

        const repoList = repos.map(r => `${r.fullName}: ${r.description || '无描述'}`).join('\n');

        try {
            let result;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: repoList },
            ];

            if (aiConfig?.mode === 'custom' && aiConfig.apiKey) {
                result = await window.githubStarsAPI.customAI(messages, aiConfig);
            } else {
                const aiOptions: any = { messages };
                if (aiConfig?.model) aiOptions.model = aiConfig.model;
                result = await utools.ai(aiOptions);
            }

            const content = result.content || '';
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const matches = JSON.parse(jsonMatch[0]) as Array<{
                    fullName: string;
                    matched: boolean;
                    reason?: string;
                    focus?: string;
                }>;

                const matchMap = new Map(matches.map(m => [m.fullName, m]));

                return repos.map(repo => {
                    const match = matchMap.get(repo.fullName);
                    if (match?.matched) {
                        return {
                            ...repo,
                            matchReason: match.reason,
                            matchedFocus: match.focus,
                        } as TrendingRepo;
                    }
                    return repo as TrendingRepo;
                });
            }
        } catch (error) {
            console.error('[TrendingService] AI 匹配失败:', error);
        }

        return repos;
    },
};
