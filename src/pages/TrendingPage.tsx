import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { trendingService, type TrendingFilters } from '../services/trendingService';
import { TrendingUp, Search, Star } from 'lucide-react';
import type { Repository } from '../types';

/**
 * 趋势页 -- GitHub Search API + AI 匹配关注重点
 */
export const TrendingPage: React.FC = () => {
    const { token, focusPoints, settings } = useStore();
    const [filters, setFilters] = useState<TrendingFilters>({
        minStars: 100,
        perPage: 30,
    });
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [matching, setMatching] = useState(false);

    const handleFetch = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // 默认查近 30 天
            const since = new Date();
            since.setDate(since.getDate() - 30);
            const result = await trendingService.fetchTrending(
                { ...filters, createdSince: since.toISOString().split('T')[0] },
                token
            );
            setRepos(result.repos);
        } catch (error) {
            console.error('拉取趋势失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMatch = async () => {
        if (repos.length === 0 || focusPoints.length === 0) return;
        setMatching(true);
        try {
            const matched = await trendingService.matchWithFocusPoints(
                repos,
                focusPoints,
                settings.aiConfig
            );
            setRepos(matched);
        } catch (error) {
            console.error('AI 匹配失败:', error);
        } finally {
            setMatching(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 顶栏 */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
            }}>
                <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>趋势发现</h2>
                <div style={{ flex: 1 }} />
            </div>

            {/* 筛选栏 */}
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <select
                    style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                    value={filters.language || ''}
                    onChange={e => setFilters({ ...filters, language: e.target.value || undefined })}
                >
                    <option value="">所有语言</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="rust">Rust</option>
                    <option value="go">Go</option>
                    <option value="java">Java</option>
                </select>
                <input
                    type="number"
                    style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)', width: 80 }}
                    placeholder="Star≥"
                    value={filters.minStars || ''}
                    onChange={e => setFilters({ ...filters, minStars: e.target.value ? Number(e.target.value) : undefined })}
                />
                <button className="btn btn-primary btn-sm" onClick={handleFetch} disabled={loading || !token}>
                    {loading ? '拉取中...' : '拉取趋势'}
                </button>
                {focusPoints.length > 0 && repos.length > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={handleMatch} disabled={matching}>
                        {matching ? 'AI 匹配中...' : `AI 匹配关注点 (${focusPoints.length})`}
                    </button>
                )}
            </div>

            {/* 关注重点提示 */}
            {focusPoints.length > 0 && (
                <div style={{ padding: '4px 16px', fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-surface-secondary)' }}>
                    关注重点：{focusPoints.map(f => f.content).join('、')}
                </div>
            )}

            {/* 仓库列表 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {repos.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                        <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <p style={{ fontSize: 14 }}>点击"拉取趋势"发现近期热门项目</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {repos.map(repo => (
                            <TrendingRepoCard key={repo.id} repo={repo} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TrendingRepoCard: React.FC<{ repo: Repository & { matchReason?: string; matchedFocus?: string } }> = ({ repo }) => {
    const matched = Boolean(repo.matchReason);
    return (
        <div className="card" style={{
            padding: 12,
            borderLeft: matched ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: matched ? 'var(--color-primary-light)' : 'var(--color-surface)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <a
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'none' }}
                    onClick={() => window.githubStarsAPI.openExternal(repo.htmlUrl)}
                >
                    {repo.fullName}
                </a>
                {repo.language && <span className="tag" style={{ fontSize: 11, padding: '0 6px' }}>{repo.language}</span>}
                <div style={{ flex: 1 }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    <Star size={12} style={{ color: 'var(--color-accent)' }} />
                    {repo.stargazersCount.toLocaleString()}
                </span>
            </div>
            {repo.description && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: matched ? 8 : 0 }}>
                    {repo.description}
                </p>
            )}
            {matched && (
                <div style={{ fontSize: 12, color: 'var(--color-primary)', fontStyle: 'italic' }}>
                    ⚡ 匹配关注点：{repo.matchedFocus} -- {repo.matchReason}
                </div>
            )}
        </div>
    );
};
