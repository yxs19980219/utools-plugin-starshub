import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { Star, Package, TrendingUp, Settings, RefreshCw, Brain, Sparkles, Plus, Folder, Check, X, Edit3, Trash2 } from 'lucide-react';
import type { View, ViewFilter } from '../types';

/** 右键菜单 hooks */
function useContextMenu() {
    const [menu, setMenu] = useState<{ x: number; y: number; viewId: string } | null>(null);
    useEffect(() => {
        if (!menu) return;
        const close = () => setMenu(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [menu]);
    return { menu, setMenu };
}

export const Sidebar: React.FC = () => {
    const {
        sidebarView, setSidebarView,
        currentPage, setCurrentPage,
        views, dimensions,
        repositories, getViewFilteredRepos,
        syncStatus, indexStatus, analyzeStatus,
        syncRepositories, setViews,
    } = useStore();

    const [showIndexMenu, setShowIndexMenu] = useState(false);
    const [showAnalyzeMenu, setShowAnalyzeMenu] = useState(false);
    const [showCreateView, setShowCreateView] = useState(false);
    const [editingView, setEditingView] = useState<View | null>(null);
    const [renamingView, setRenamingView] = useState<View | null>(null);
    const [deletingView, setDeletingView] = useState<View | null>(null);
    const ctxMenu = useContextMenu();

    const isReposView = currentPage === 'home';
    const totalRepos = repositories.length;
    const analyzedCount = repositories.filter(r => r.analyzedAt && !r.analysisFailed).length;
    const unreadReleases = useStore(s => s.getUnreadCount?.() || 0);

    const handleViewClick = (viewId: 'all' | string) => {
        setSidebarView(viewId);
        if (currentPage !== 'home') setCurrentPage('home');
    };

    const sidebarStyle: React.CSSProperties = {
        width: 142, minWidth: 142,
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface-secondary)',
        height: '100%', overflow: 'visible', userSelect: 'none', position: 'relative',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px 4px',
    };

    const itemStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px 6px 12px', fontSize: 13, cursor: 'pointer',
        color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
        background: active ? 'var(--color-primary-light)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        transition: 'background 0.15s',
    });

    const badgeStyle: React.CSSProperties = {
        marginLeft: 'auto', fontSize: 9, color: 'var(--color-text-muted)',
        background: 'var(--color-surface)', padding: '0 3px', borderRadius: 6, minWidth: 14, textAlign: 'center', flexShrink: 0, lineHeight: '14px', height: '14px',
    };

    const nameSpanStyle: React.CSSProperties = {
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0,
    };

    return (
        <div style={sidebarStyle}>
            {/* 视图区 */}
            <div style={sectionTitleStyle}>视图</div>
            <div style={itemStyle(isReposView && sidebarView === 'all')} onClick={() => handleViewClick('all')}>
                <Star size={14} />
                <span>全部仓库</span>
                <span style={badgeStyle}>{totalRepos}</span>
            </div>
            {views.map(view => {
                const count = getViewFilteredRepos(view.id).length;
                return (
                    <div
                        key={view.id}
                        style={itemStyle(isReposView && sidebarView === view.id)}
                        onClick={() => handleViewClick(view.id)}
                        onContextMenu={(e) => { e.preventDefault(); ctxMenu.setMenu({ x: e.clientX, y: e.clientY, viewId: view.id }); }}
                    >
                        <Folder size={14} style={{ flexShrink: 0 }} />
                        <span style={nameSpanStyle} title={view.name}>{view.name}</span>
                        <span style={badgeStyle}>{count}</span>
                    </div>
                );
            })}
            <div style={{ ...itemStyle(false), color: 'var(--color-text-muted)' }} onClick={() => setShowCreateView(true)}>
                <Plus size={14} />
                <span>新建视图</span>
            </div>

            {/* 右键菜单 */}
            {ctxMenu.menu && (
                <div style={{
                    position: 'fixed', left: ctxMenu.menu.x, top: ctxMenu.menu.y,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 8, padding: 4, zIndex: 3000, minWidth: 120,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }} onClick={e => e.stopPropagation()}>
                    {[
                        { label: '编辑配置', icon: <Edit3 size={12} />, action: () => { const v = views.find(v => v.id === ctxMenu.menu!.viewId); if (v) setEditingView(v); } },
                        { label: '重命名', icon: <Edit3 size={12} />, action: () => { const v = views.find(v => v.id === ctxMenu.menu!.viewId); if (v) setRenamingView(v); } },
                        { label: '删除', icon: <Trash2 size={12} />, action: () => { const v = views.find(v => v.id === ctxMenu.menu!.viewId); if (v) setDeletingView(v); }, danger: true },
                    ].map(item => (
                        <div key={item.label} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                            fontSize: 12, cursor: 'pointer', borderRadius: 4,
                            color: item.danger ? 'var(--color-error)' : 'var(--color-text-primary)',
                        }} onClick={() => { item.action(); ctxMenu.setMenu(null); }}>
                            {item.icon} {item.label}
                        </div>
                    ))}
                </div>
            )}

            {/* 弹框 */}
            {showCreateView && (
                <ViewModal dimensions={dimensions} title="新建视图"
                    onClose={() => setShowCreateView(false)}
                    onSave={(name, filters) => {
                        setViews([...views, { id: `view-${Date.now()}`, name, filters, order: views.length, createdAt: Date.now(), updatedAt: Date.now() }]);
                        setShowCreateView(false);
                    }}
                />
            )}
            {editingView && (
                <ViewModal dimensions={dimensions} title="编辑配置" initialName={editingView.name} initialFilters={editingView.filters}
                    onClose={() => setEditingView(null)}
                    onSave={(name, filters) => {
                        setViews(views.map(v => v.id === editingView.id ? { ...v, name, filters, updatedAt: Date.now() } : v));
                        setEditingView(null);
                    }}
                />
            )}
            {renamingView && (
                <RenameModal name={renamingView.name}
                    onClose={() => setRenamingView(null)}
                    onSave={(name) => {
                        setViews(views.map(v => v.id === renamingView.id ? { ...v, name, updatedAt: Date.now() } : v));
                        setRenamingView(null);
                    }}
                />
            )}
            {deletingView && (
                <ConfirmModal title="删除视图" message={`确认删除视图"${deletingView.name}"？`}
                    onClose={() => setDeletingView(null)}
                    onConfirm={() => {
                        setViews(views.filter(v => v.id !== deletingView.id));
                        if (sidebarView === deletingView.id) setSidebarView('all');
                        setDeletingView(null);
                    }}
                />
            )}

            {/* 操作区 + 功能区（底部） */}
            <div style={{ marginTop: 'auto' }}>
                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div style={sectionTitleStyle}>操作</div>
                    <div style={itemStyle(false)} onClick={() => syncRepositories()}>
                        <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                        <span>同步</span>
                        {syncStatus === 'syncing' && <span style={badgeStyle}>⟳</span>}
                    </div>
                    <div style={itemStyle(false)} onClick={(e) => { e.stopPropagation(); setShowIndexMenu(!showIndexMenu); setShowAnalyzeMenu(false); }}>
                        <Brain size={14} /><span>索引</span>
                        {indexStatus === 'building' && <span style={badgeStyle}>⟳</span>}
                    </div>
                    {showIndexMenu && (<><div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowIndexMenu(false)} /><div style={{ position: 'fixed', left: 152, top: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, minWidth: 200, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}><IndexMenuContent onClose={() => setShowIndexMenu(false)} /></div></>)}
                    <div style={itemStyle(false)} onClick={(e) => { e.stopPropagation(); setShowAnalyzeMenu(!showAnalyzeMenu); setShowIndexMenu(false); }}>
                        <Sparkles size={14} /><span>分析</span>
                        {analyzeStatus === 'analyzing' && <span style={badgeStyle}>⟳</span>}
                    </div>
                    {showAnalyzeMenu && (<><div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowAnalyzeMenu(false)} /><div style={{ position: 'fixed', left: 152, top: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, minWidth: 200, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}><AnalyzeMenuContent analyzedCount={analyzedCount} totalCount={totalRepos} onClose={() => setShowAnalyzeMenu(false)} /></div></>)}
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div style={sectionTitleStyle}>功能</div>
                    <div style={itemStyle(currentPage === 'releases')} onClick={() => setCurrentPage('releases')}>
                        <Package size={14} /><span>发布</span>
                        {unreadReleases > 0 && <span style={{ ...badgeStyle, color: 'var(--color-primary)' }}>{unreadReleases}</span>}
                    </div>
                    <div style={itemStyle(currentPage === 'trending')} onClick={() => setCurrentPage('trending')}>
                        <TrendingUp size={14} /><span>趋势</span>
                    </div>
                    <div style={itemStyle(currentPage === 'settings')} onClick={() => setCurrentPage('settings')}>
                        <Settings size={14} /><span>设置</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 视图新建/编辑弹框（通用） */
const ViewModal: React.FC<{
    dimensions: any[]; title: string;
    initialName?: string; initialFilters?: ViewFilter[];
    onClose: () => void; onSave: (name: string, filters: ViewFilter[]) => void;
}> = ({ dimensions, title, initialName = '', initialFilters = [], onClose, onSave }) => {
    const [name, setName] = useState(initialName);
    const [selected, setSelected] = useState<Record<string, string[]>>(() => {
        const map: Record<string, string[]> = {};
        initialFilters.forEach(f => { if (f.optionIds.length > 0) map[f.dimensionId] = [...f.optionIds]; });
        return map;
    });

    const handleToggle = (dimId: string, optId: string) => {
        setSelected(prev => {
            const current = prev[dimId] || [];
            const next = current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId];
            const copy = { ...prev };
            if (next.length > 0) copy[dimId] = next; else delete copy[dimId];
            return copy;
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
            <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
                <input className="input" style={{ width: '100%', marginBottom: 16, fontSize: 14 }} placeholder="视图名称" value={name} onChange={e => setName(e.target.value)} autoFocus />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>选择标签维度（AND 关系）</div>
                {dimensions.map(dim => (
                    <div key={dim.id} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-muted)' }}>{dim.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {dim.options.map((opt: any) => {
                                const active = (selected[dim.id] || []).includes(opt.id);
                                return <button key={opt.id} className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999 }} onClick={() => handleToggle(dim.id, opt.id)}>{active && <Check size={10} style={{ display: 'inline', marginRight: 2 }} />}{opt.name}</button>;
                            })}
                        </div>
                    </div>
                ))}
                {dimensions.length === 0 && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>暂无标签维度，请先在设置中创建维度</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={12} /> 取消</button>
                    <button className="btn btn-primary btn-sm" onClick={() => onSave(name.trim(), Object.entries(selected).map(([dimId, optionIds]) => ({ dimensionId: dimId, optionIds })))} disabled={!name.trim()}><Check size={12} /> 保存</button>
                </div>
            </div>
        </div>
    );
};

/** 重命名弹框 */
const RenameModal: React.FC<{ name: string; onClose: () => void; onSave: (name: string) => void }> = ({ name, onClose, onSave }) => {
    const [value, setValue] = useState(name);
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
            <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 20, width: '90%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>重命名视图</h3>
                <input className="input" style={{ width: '100%', marginBottom: 16, fontSize: 14 }} value={value} onChange={e => setValue(e.target.value)} autoFocus />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>取消</button>
                    <button className="btn btn-primary btn-sm" onClick={() => onSave(value.trim())} disabled={!value.trim()}>保存</button>
                </div>
            </div>
        </div>
    );
};

/** 确认弹框 */
const ConfirmModal: React.FC<{ title: string; message: string; onClose: () => void; onConfirm: () => void }> = ({ title, message, onClose, onConfirm }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
        <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 20, width: '90%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>{message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>取消</button>
                <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff' }} onClick={onConfirm}>确认删除</button>
            </div>
        </div>
    </div>
);

/** 索引菜单内容 */
const IndexMenuContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { settings, repositories, setIndexStatus } = useStore();
    const embeddingConfig = settings.embeddingConfig;
    const meta = window.githubStarsAPI.getVectorMeta();
    return (
        <>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>向量索引 {meta ? `(${meta.count}已索引)` : '(未配置)'}</div>
            {!embeddingConfig && <div style={{ fontSize: 12, color: 'var(--color-error)', marginBottom: 8 }}>请先在设置中配置 Embedding</div>}
            <button className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%', marginBottom: 4 }} disabled={!embeddingConfig} onClick={async () => { if (!embeddingConfig) return; onClose(); setIndexStatus('building'); const { vectorService } = await import('../services/vectorService'); await vectorService.incrementalIndex(repositories, embeddingConfig); setIndexStatus('done'); }}>增量索引</button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%', marginBottom: 4 }} disabled={!embeddingConfig} onClick={async () => { if (!embeddingConfig) return; onClose(); setIndexStatus('building'); const { vectorService } = await import('../services/vectorService'); await vectorService.buildIndex(repositories, embeddingConfig); setIndexStatus('done'); }}>重建索引</button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%' }} onClick={() => { useStore.getState().setCurrentPage('settings'); onClose(); }}>索引设置</button>
        </>
    );
};

/** AI分析菜单内容 */
const AnalyzeMenuContent: React.FC<{ analyzedCount: number; totalCount: number; onClose: () => void }> = ({ analyzedCount, totalCount, onClose }) => {
    const { startAutoAnalyze } = useStore();
    const [showConfirm, setShowConfirm] = useState(false);
    if (showConfirm) return (
        <>
            <div style={{ fontSize: 13, marginBottom: 8 }}>确认全部重新分析？</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>将清除所有已分析结果并重新分析 {totalCount} 个仓库</div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>取消</button>
                <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff' }} onClick={() => { setShowConfirm(false); onClose(); const { repositories, setRepositories, saveRepositories, startAutoAnalyze } = useStore.getState(); setRepositories(repositories.map(r => ({ ...r, analyzedAt: undefined, analysisFailed: false }))); saveRepositories(); startAutoAnalyze(); }}>确认</button>
            </div>
        </>
    );
    return (
        <>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>AI 分析 ({analyzedCount}/{totalCount}已分析)</div>
            <button className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%', marginBottom: 4 }} onClick={() => { onClose(); startAutoAnalyze(); }}>增量分析</button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%', marginBottom: 4 }} onClick={() => setShowConfirm(true)}>全部重新分析</button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%' }} onClick={() => { useStore.getState().setCurrentPage('settings'); onClose(); }}>分析设置</button>
        </>
    );
};
