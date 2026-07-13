import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { Search, Zap, Tag, Code2, Package, ArrowDownUp, List, LayoutGrid, X } from 'lucide-react';
import { PLATFORM_OPTIONS } from '../constants/platforms';
import type { SortBy } from '../types';

/**
 * 图标弹出下拉 hooks
 */
function useDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    return { open, setOpen, ref };
}

const iconBtnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)',
    background: 'var(--color-background)', cursor: 'pointer', position: 'relative',
    color: 'var(--color-text-secondary)', flexShrink: 0,
};

const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', right: 0, marginTop: 4,
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 8, padding: 8, zIndex: 500, minWidth: 160,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    maxHeight: 300, overflowY: 'auto',
};

const optStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
    fontSize: 12, cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap',
};

/**
 * 工具栏 -- 仓库页定制栏
 * 搜索框（宽）+ 右侧图标按钮组（语义/标签/语言/平台/排序/视图模式）
 */
export const Toolbar: React.FC = () => {
    const {
        preciseSearchKeyword, setPreciseSearchKeyword,
        searchFilter, setSearchFilter,
        viewMode, setViewMode,
        settings,
        dimensions,
        isSemanticSearching, setIsSemanticSearching,
        clearSemanticResults,
    } = useStore();

    const semanticDropdown = useDropdown();
    const tagDropdown = useDropdown();
    const langDropdown = useDropdown();
    const platformDropdown = useDropdown();
    const sortDropdown = useDropdown();

    const sortBy = searchFilter.sortBy || settings.defaultSortBy || 'stars';
    const repositories = useStore(s => s.repositories);
    const allLanguages = Array.from(new Set(repositories.map(r => r.language).filter(Boolean))) as string[];

    const selectedLanguage = (searchFilter.languages || [])[0] || '';
    const selectedPlatform = (searchFilter.platforms || [])[0] || '';

    // 是否有筛选激活
    const tagActive = (searchFilter.aiTags || []).length > 0;
    const langActive = !!selectedLanguage;
    const platformActive = !!selectedPlatform;

    const activeColor = (active: boolean) => active ? 'var(--color-primary)' : 'var(--color-text-secondary)';
    const activeBorder = (active: boolean) => active ? 'var(--color-primary)' : 'var(--color-border)';

    const handleDimensionChange = (dimId: string, optId: string) => {
        const current = searchFilter.aiTags || [];
        const existing = current.find(t => t.startsWith(`${dimId}:`));
        if (existing === `${dimId}:${optId}`) {
            // 取消选择
            setSearchFilter({ aiTags: current.filter(t => !t.startsWith(`${dimId}:`)) });
        } else {
            const others = current.filter(t => !t.startsWith(`${dimId}:`));
            setSearchFilter({ aiTags: [...others, `${dimId}:${optId}`] });
        }
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)', flexShrink: 0,
        }}>
            {/* 搜索框（加宽） */}
            <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    style={{
                        width: '100%', padding: '6px 10px 6px 30px', fontSize: 13,
                        border: '1px solid var(--color-border)', borderRadius: 6,
                        background: 'var(--color-background)', color: 'var(--color-text-primary)', outline: 'none',
                    }}
                    placeholder="精确搜索项目名、描述、AI分析..."
                    value={preciseSearchKeyword}
                    onChange={e => setPreciseSearchKeyword(e.target.value)}
                />
                <style>{`input::placeholder { color: var(--color-text-muted); opacity: 0.5; }`}</style>
                {preciseSearchKeyword && (
                    <button style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }} onClick={() => setPreciseSearchKeyword('')}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* 语义搜索开关 */}
            <button
                style={{ ...iconBtnBase, color: activeColor(isSemanticSearching), borderColor: activeBorder(isSemanticSearching), background: isSemanticSearching ? 'var(--color-primary-light)' : 'var(--color-background)' }}
                onClick={() => {
                    if (isSemanticSearching) { setIsSemanticSearching(false); clearSemanticResults(); }
                    else { setIsSemanticSearching(true); }
                }}
                title={isSemanticSearching ? '语义搜索已开启' : '开启语义搜索'}
            >
                <Zap size={14} />
            </button>

            {/* 标签维度筛选 */}
            <div ref={tagDropdown.ref} style={{ position: 'relative' }}>
                <button
                    style={{ ...iconBtnBase, color: activeColor(tagActive), borderColor: activeBorder(tagActive) }}
                    onClick={() => tagDropdown.setOpen(!tagDropdown.open)}
                    title="标签维度筛选"
                >
                    <Tag size={14} />
                </button>
                {tagDropdown.open && (
                    <div style={dropdownStyle}>
                        {dimensions.filter(d => !d.isFixed).length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px' }}>暂无自定义维度</div>
                        )}
                        {dimensions.filter(d => !d.isFixed).map(dim => (
                            <div key={dim.id} style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>{dim.name}</div>
                                {dim.options.map((opt: any) => {
                                    const tag = `${dim.id}:${opt.id}`;
                                    const active = (searchFilter.aiTags || []).includes(tag);
                                    return (
                                        <div key={opt.id} style={{ ...optStyle, color: active ? 'var(--color-primary)' : 'var(--color-text-primary)', fontWeight: active ? 600 : 400 }} onClick={() => handleDimensionChange(dim.id, opt.id)}>
                                            <span style={{ width: 14, textAlign: 'center' }}>{active ? '✓' : ''}</span>
                                            <span title={opt.description}>{opt.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {/* 平台维度（固定） */}
                        <div style={{ marginBottom: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>平台</div>
                            {PLATFORM_OPTIONS.map(p => {
                                const active = selectedPlatform === p.id;
                                return (
                                    <div key={p.id} style={{ ...optStyle, color: active ? 'var(--color-primary)' : 'var(--color-text-primary)', fontWeight: active ? 600 : 400 }} onClick={() => setSearchFilter({ platforms: active ? [] : [p.id] })}>
                                        <span style={{ width: 14, textAlign: 'center' }}>{active ? '✓' : ''}</span>
                                        <span>{p.icon} {p.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 语言筛选 */}
            <div ref={langDropdown.ref} style={{ position: 'relative' }}>
                <button
                    style={{ ...iconBtnBase, color: activeColor(langActive), borderColor: activeBorder(langActive) }}
                    onClick={() => langDropdown.setOpen(!langDropdown.open)}
                    title="语言筛选"
                >
                    <Code2 size={14} />
                </button>
                {langDropdown.open && (
                    <div style={dropdownStyle}>
                        {allLanguages.map(lang => {
                            const active = selectedLanguage === lang;
                            return (
                                <div key={lang} style={{ ...optStyle, color: active ? 'var(--color-primary)' : 'var(--color-text-primary)', fontWeight: active ? 600 : 400 }} onClick={() => setSearchFilter({ languages: active ? [] : [lang] })}>
                                    <span style={{ width: 14, textAlign: 'center' }}>{active ? '✓' : ''}</span>
                                    <span>{lang}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 排序 */}
            <div ref={sortDropdown.ref} style={{ position: 'relative' }}>
                <button
                    style={{ ...iconBtnBase }}
                    onClick={() => sortDropdown.setOpen(!sortDropdown.open)}
                    title="排序"
                >
                    <ArrowDownUp size={14} />
                </button>
                {sortDropdown.open && (
                    <div style={dropdownStyle}>
                        {[
                            { value: 'stars', label: 'Star 数' },
                            { value: 'updated', label: '更新时间' },
                            { value: 'name', label: '名称' },
                            { value: 'starredAt', label: '收藏时间' },
                        ].map(opt => {
                            const active = sortBy === opt.value;
                            return (
                                <div key={opt.value} style={{ ...optStyle, color: active ? 'var(--color-primary)' : 'var(--color-text-primary)', fontWeight: active ? 600 : 400 }} onClick={() => { setSearchFilter({ sortBy: opt.value as SortBy }); sortDropdown.setOpen(false); }}>
                                    <span style={{ width: 14, textAlign: 'center' }}>{active ? '✓' : ''}</span>
                                    <span>{opt.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 视图模式切换 */}
            <div style={{ display: 'flex', gap: 2 }}>
                <button
                    style={{ ...iconBtnBase, color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderColor: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-border)' }}
                    onClick={() => setViewMode('list')}
                    title="列表视图"
                >
                    <List size={14} />
                </button>
                <button
                    style={{ ...iconBtnBase, color: viewMode === 'card' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderColor: viewMode === 'card' ? 'var(--color-primary)' : 'var(--color-border)' }}
                    onClick={() => setViewMode('card')}
                    title="卡片视图"
                >
                    <LayoutGrid size={14} />
                </button>
            </div>
        </div>
    );
};
