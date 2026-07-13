import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import { storageService } from '../services/storageService';
import { githubService } from '../services/githubService';
import { t } from '../locales';
import { TokenHelp, TokenHelpHeaderButton } from '../components/TokenHelp';
import { logger } from '../utils/logger';
import { useBackShortcut } from '../hooks/useBackShortcut';
import {
    ArrowLeft, Key, Check, X, Loader2, Download, Upload,
    Sun, Moon, Monitor, Sparkles, Play, StopCircle, Zap, Bell, Tag, Database, Info, Settings as SettingsIcon, Plus
} from 'lucide-react';

type TabId = '通用' | 'AI' | '嵌入' | '标签' | '数据' | '关于';

export const SettingsPage: React.FC = () => {
    const projectRepositoryUrl = 'https://github.com/yxs19980219/utools-plugin-starshub';
    const {
        settings, saveSettings, token, setCurrentPage,
        repositories, setRepositories, saveRepositories,
        isAnalyzing, analyzeProgress, startAutoAnalyze, stopAnalyze,
        releaseCheckStatus, checkReleaseUpdates, setReleasesInitialTab,
        dimensions, setDimensions,
    } = useStore();

    const lang = (settings.language || 'zh') as 'zh' | 'en';
    const [activeTab, setActiveTab] = useState<TabId>('通用');
    const [tokenInput, setTokenInput] = useState(token || '');
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<'success' | 'error' | null>(null);
    const [aiModels, setAiModels] = useState<any[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [tokenHelpExpanded, setTokenHelpExpanded] = useState(false);
    const [embeddingStatus, setEmbeddingStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
    const [aiStatus, setAiStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
    const [customEndpoint, setCustomEndpoint] = useState('');
    const [customKey, setCustomKey] = useState('');
    const [customModel, setCustomModel] = useState('');
    const [customName, setCustomName] = useState('');
    const [configTestStatus, setConfigTestStatus] = useState<Record<string, 'idle' | 'testing' | 'connected' | 'failed'>>({});
    const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);
    const [editEndpoint, setEditEndpoint] = useState('');
    const [editKey, setEditKey] = useState('');
    const [editModel, setEditModel] = useState('');
    const autoSyncTimerRef = useRef<number | null>(null);

    useEffect(() => {
        loadAIModels();
    }, []);

    // 自动测试 Embedding 连接（切换到嵌入 tab 或配置变化时）
    useEffect(() => {
        if (activeTab === '嵌入' && settings.embeddingConfig?.provider && settings.embeddingConfig?.model) {
            setEmbeddingStatus('testing');
            window.githubStarsAPI.testEmbeddingConnection(settings.embeddingConfig)
                .then(r => setEmbeddingStatus(r.success ? 'connected' : 'failed'))
                .catch(() => setEmbeddingStatus('failed'));
        }
    }, [activeTab, settings.embeddingConfig?.provider, settings.embeddingConfig?.model, settings.embeddingConfig?.apiKey]);

    // 自动测试自定义 AI 连接（切换到 AI tab 或配置变化时）
    useEffect(() => {
        if (activeTab === 'AI' && settings.aiConfig?.mode === 'custom' && settings.aiConfig?.apiKey && settings.aiConfig?.endpoint) {
            setAiStatus('testing');
            window.githubStarsAPI.customAI(
                [{ role: 'user', content: 'hi' }],
                { mode: 'custom', apiKey: settings.aiConfig.apiKey, endpoint: settings.aiConfig.endpoint, model: settings.aiConfig.model }
            ).then(() => setAiStatus('connected'))
             .catch(() => setAiStatus('failed'));
        }
    }, [activeTab, settings.aiConfig?.mode, settings.aiConfig?.apiKey, settings.aiConfig?.endpoint]);

    useEffect(() => {
        return () => {
            if (autoSyncTimerRef.current !== null) {
                window.clearTimeout(autoSyncTimerRef.current);
            }
        };
    }, []);

    const loadAIModels = async () => {
        setLoadingModels(true);
        try {
            const models = await window.githubStarsAPI.getAIModels();
            setAiModels(models || []);
        } catch (e) {
            console.error('Failed to load AI models:', e);
        } finally {
            setLoadingModels(false);
        }
    };

    const handleBack = useCallback(() => {
        setCurrentPage('home');
    }, [setCurrentPage]);

    useBackShortcut({
        onBack: handleBack,
        deps: [handleBack],
    });

    const scheduleAutoSync = () => {
        const { syncStatus } = useStore.getState();
        if (syncStatus === 'syncing') return;
        if (autoSyncTimerRef.current !== null) window.clearTimeout(autoSyncTimerRef.current);
        autoSyncTimerRef.current = window.setTimeout(() => {
            autoSyncTimerRef.current = null;
            window.dispatchEvent(new CustomEvent('trigger-sync'));
        }, 500);
    };

    const handleVerifyToken = async () => {
        if (!tokenInput.trim()) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const valid = await githubService.verifyToken(tokenInput.trim());
            if (valid) {
                storageService.setToken(tokenInput.trim());
                useStore.setState({ token: tokenInput.trim() });
                setVerifyResult('success');
                scheduleAutoSync();
            } else {
                setVerifyResult('error');
            }
        } catch {
            setVerifyResult('error');
        } finally {
            setVerifying(false);
        }
    };

    const handleExport = () => {
        const data = { version: '1.0.0', exportedAt: new Date().toISOString(), repositories, settings };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `starshub-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target?.result as string);
                    if (data.repositories) { setRepositories(data.repositories); saveRepositories(); }
                    if (data.settings) { saveSettings(data.settings); }
                    window.githubStarsAPI.showNotification('数据导入成功');
                } catch {
                    window.githubStarsAPI.showNotification('导入失败：文件格式错误');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const themeOptions = [
        { value: 'auto', icon: <Monitor size={14} />, label: t('autoTheme', lang) },
        { value: 'light', icon: <Sun size={14} />, label: t('lightTheme', lang) },
        { value: 'dark', icon: <Moon size={14} />, label: t('darkTheme', lang) },
    ] as const;

    const subscribedCount = window.githubStarsAPI.getReleaseSubscriptions().length;

    const tabs: { id: TabId; icon: React.ReactNode }[] = [
        { id: '通用', icon: <SettingsIcon size={14} /> },
        { id: 'AI', icon: <Sparkles size={14} /> },
        { id: '嵌入', icon: <Zap size={14} /> },
        { id: '标签', icon: <Tag size={14} /> },
        { id: '数据', icon: <Database size={14} /> },
        { id: '关于', icon: <Info size={14} /> },
    ];

    const navItemStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', fontSize: 13, cursor: 'pointer',
        color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
        background: active ? 'var(--color-primary-light)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        borderRadius: 0,
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 顶栏 */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)', flexShrink: 0,
            }}>
                <button className="btn btn-ghost btn-sm" onClick={handleBack}>
                    <ArrowLeft size={16} />{t('back', lang)}
                </button>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t('settings', lang)}</h2>
            </div>

            {/* 左导航 + 右内容 */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* 左侧子导航 */}
                <div style={{
                    width: 100, minWidth: 100, borderRight: '1px solid var(--color-border)',
                    background: 'var(--color-surface-secondary)', paddingTop: 8,
                }}>
                    {tabs.map(tab => (
                        <div key={tab.id} style={navItemStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
                            {tab.icon}
                            <span>{tab.id}</span>
                        </div>
                    ))}
                </div>

                {/* 右侧内容区 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="animate-fade-in">

                    {/* ===== 通用 ===== */}
                    {activeTab === '通用' && (
                        <>
                            {/* Token */}
                            <div className="card" style={{ marginBottom: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Key size={14} style={{ color: 'var(--color-primary)' }} />
                                    {t('githubToken', lang)}
                                    <TokenHelpHeaderButton lang={lang} expanded={tokenHelpExpanded} onToggle={() => setTokenHelpExpanded(!tokenHelpExpanded)} />
                                </h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input type="password" className="input" value={tokenInput} onChange={(e) => { setTokenInput(e.target.value); setVerifyResult(null); }} placeholder={t('tokenPlaceholder', lang)} />
                                    <button className="btn btn-primary" onClick={handleVerifyToken} disabled={verifying || !tokenInput.trim()} style={{ flexShrink: 0 }}>
                                        {verifying ? <Loader2 size={14} className="animate-spin" /> : verifyResult === 'success' ? <Check size={14} /> : verifyResult === 'error' ? <X size={14} /> : <Key size={14} />}
                                        {t('verifyToken', lang)}
                                    </button>
                                </div>
                                {verifyResult && (
                                    <p style={{ fontSize: 13, marginTop: 6, color: verifyResult === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                                        {verifyResult === 'success' ? t('tokenVerified', lang) : t('tokenInvalid', lang)}
                                    </p>
                                )}
                                <TokenHelp lang={lang} expanded={tokenHelpExpanded} onToggle={() => setTokenHelpExpanded(!tokenHelpExpanded)} />
                            </div>

                            {/* AI 分析设置 */}
                            <div className="card" style={{ marginBottom: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                                    AI 分析设置
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>启动时自动分析</div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>打开插件时自动分析未分析的仓库</div>
                                    </div>
                                    <button className={`btn ${settings.autoAnalyzeOnOpen ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ autoAnalyzeOnOpen: !settings.autoAnalyzeOnOpen })} style={{ minWidth: 60 }}>
                                        {settings.autoAnalyzeOnOpen ? '开' : '关'}
                                    </button>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>并发数</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button key={n} className={`btn ${(settings.aiConcurrency || 1) === n ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ aiConcurrency: n })} style={{ flex: 1 }}>{n}</button>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>并发数越高分析越快，但可能触发限流</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button className="btn btn-primary btn-sm" onClick={() => isAnalyzing ? stopAnalyze() : startAutoAnalyze()} disabled={!token || repositories.length === 0} style={{ flex: 1 }}>
                                        {isAnalyzing ? <><StopCircle size={14} />停止分析</> : <><Play size={14} />立即分析</>}
                                    </button>
                                </div>
                                {isAnalyzing && analyzeProgress && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>正在分析: {analyzeProgress.currentRepo}</div>
                                        <div style={{ height: 4, background: 'var(--color-surface-secondary)', borderRadius: 2 }}>
                                            <div style={{ height: '100%', width: `${Math.round((analyzeProgress.current / analyzeProgress.total) * 100)}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', borderRadius: 2, transition: 'width 0.3s ease' }} />
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{analyzeProgress.current}/{analyzeProgress.total}</div>
                                    </div>
                                )}
                                {!isAnalyzing && repositories.length > 0 && (
                                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        已分析: {repositories.filter(r => r.analyzedAt && !r.analysisFailed).length} / {repositories.length} 个仓库
                                        {repositories.filter(r => r.analysisFailed).length > 0 && <span style={{ color: 'var(--color-error)', marginLeft: 8 }}>(失败: {repositories.filter(r => r.analysisFailed).length})</span>}
                                    </div>
                                )}
                            </div>

                            {/* 版本追踪设置 */}
                            <div className="card" style={{ marginBottom: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Bell size={14} style={{ color: 'var(--color-primary)' }} />
                                    {t('releaseSubscription', lang)}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{t('autoCheckUpdates', lang)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>打开插件时自动检查订阅仓库的版本更新</div>
                                    </div>
                                    <button className={`btn ${(settings.autoCheckReleaseUpdates !== false) ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ autoCheckReleaseUpdates: settings.autoCheckReleaseUpdates === false })} style={{ minWidth: 60 }}>
                                        {(settings.autoCheckReleaseUpdates !== false) ? '开' : '关'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{t('subscribedRepos', lang)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t('subscribedCount', lang, { count: subscribedCount })}</div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setReleasesInitialTab('subscriptions'); setCurrentPage('releases'); }}>{t('manageSubscriptions', lang)}</button>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => checkReleaseUpdates()} disabled={releaseCheckStatus.checking || !token || subscribedCount === 0} style={{ width: '100%' }}>
                                    {releaseCheckStatus.checking ? <><Loader2 size={14} className="animate-spin" />{t('checkingUpdates', lang)}</> : <><Bell size={14} />{t('checkUpdates', lang)}</>}
                                </button>
                                {releaseCheckStatus.lastCheckedAt && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>{t('lastChecked', lang)}: {new Date(releaseCheckStatus.lastCheckedAt).toLocaleString('zh-CN')}</div>}
                                {releaseCheckStatus.error && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-error)' }}>⚠️ {releaseCheckStatus.error}</div>}
                            </div>

                            {/* 主题 */}
                            <div className="card" style={{ marginBottom: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t('theme', lang)}</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {themeOptions.map((opt) => (
                                        <button key={opt.value} className={`btn ${settings.theme === opt.value ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ theme: opt.value })} style={{ flex: 1 }}>{opt.icon} {opt.label}</button>
                                    ))}
                                </div>
                            </div>

                            {/* 每页数量 */}
                            <div className="card">
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t('itemsPerPage', lang)}</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[10, 20, 50, 100].map((n) => (
                                        <button key={n} className={`btn ${settings.itemsPerPage === n ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ itemsPerPage: n })} style={{ flex: 1 }}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ===== AI ===== */}
                    {activeTab === 'AI' && (
                        <>
                            {/* uTools 内置 AI */}
                            <div className="card" style={{ marginBottom: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Sparkles size={14} /> uTools 内置 AI
                                    {(settings.aiConfig?.mode || 'utools') === 'utools' && (
                                        <span style={{ fontSize: 11, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1px 8px', borderRadius: 999 }}>当前使用</span>
                                    )}
                                </h3>
                                {loadingModels ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
                                        <Loader2 size={14} className="animate-spin" /> 加载模型列表...
                                    </div>
                                ) : aiModels.length === 0 ? (
                                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>未找到可用的 AI 模型，请在 uTools 主设置中配置</p>
                                ) : (
                                    <select className="input" value={settings.aiModel || ''} onChange={(e) => saveSettings({ aiModel: e.target.value })} style={{ cursor: 'pointer', marginBottom: 10 }}>
                                        <option value="">默认模型</option>
                                        {aiModels.map((model: any) => {
                                            const modelId = typeof model === 'string' ? model : (model.id || model.name || String(model));
                                            const modelName = typeof model === 'string' ? model : (model.title || model.label || model.displayName || model.name || (model.id && !model.id.startsWith('aimodels/') ? model.id : null) || model.model || modelId);
                                            return <option key={modelId} value={modelId}>{modelName}</option>;
                                        })}
                                    </select>
                                )}
                                <button
                                    className={`btn btn-sm ${(settings.aiConfig?.mode || 'utools') === 'utools' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => saveSettings({ aiConfig: { ...(settings.aiConfig || {}), mode: 'utools' } })}
                                    style={{ width: '100%' }}
                                    disabled={(settings.aiConfig?.mode || 'utools') === 'utools'}
                                >
                                    {(settings.aiConfig?.mode || 'utools') === 'utools' ? '已启用' : '启用'}
                                </button>
                            </div>

                            {/* 已保存的自定义 API 配置列表 */}
                            {(settings.savedAIConfigs || []).map((cfg) => {
                                const isActive = settings.aiConfig?.mode === 'custom' && settings.aiConfig?.endpoint === cfg.endpoint && settings.aiConfig?.apiKey === cfg.apiKey;
                                const status = configTestStatus[cfg.id] || 'idle';
                                const isExpanded = expandedConfigId === cfg.id;
                                return (
                                    <div key={cfg.id} className="card" style={{ marginBottom: 12 }}>
                                        {/* 折叠头部 */}
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                                            onClick={() => {
                                                if (isExpanded) {
                                                    setExpandedConfigId(null);
                                                } else {
                                                    setExpandedConfigId(cfg.id);
                                                    setEditEndpoint(cfg.endpoint);
                                                    setEditKey(cfg.apiKey);
                                                    setEditModel(cfg.model);
                                                }
                                            }}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{cfg.name}</span>
                                            {isActive && <span style={{ fontSize: 11, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1px 8px', borderRadius: 999 }}>当前使用</span>}
                                            {status === 'connected' && <span style={{ fontSize: 12, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /></span>}
                                            {status === 'failed' && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>连接失败</span>}
                                            {status === 'testing' && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}><Loader2 size={12} className="animate-spin" /></span>}
                                            <div style={{ flex: 1 }} />
                                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{isExpanded ? '▼' : '▶'}</span>
                                        </div>

                                        {/* 展开后：编辑 + 操作 */}
                                        {isExpanded && (
                                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <input className="input" style={{ fontSize: 13 }} placeholder="API Endpoint (如 https://api.deepseek.com)" value={editEndpoint} onChange={e => setEditEndpoint(e.target.value)} />
                                                <input className="input" style={{ fontSize: 13 }} placeholder="API Key" type="password" value={editKey} onChange={e => setEditKey(e.target.value)} />
                                                <input className="input" style={{ fontSize: 13 }} placeholder="模型 (如 gpt-4o-mini)" value={editModel} onChange={e => setEditModel(e.target.value)} />
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => {
                                                        const newList = (settings.savedAIConfigs || []).map(c => c.id === cfg.id ? { ...c, endpoint: editEndpoint.trim(), apiKey: editKey.trim(), model: editModel.trim(), name: editModel.trim() } : c);
                                                        saveSettings({ savedAIConfigs: newList });
                                                        setExpandedConfigId(null);
                                                    }}>保存</button>
                                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={async () => {
                                                        setConfigTestStatus(prev => ({ ...prev, [cfg.id]: 'testing' }));
                                                        try {
                                                            await window.githubStarsAPI.customAI(
                                                                [{ role: 'user', content: 'hi' }],
                                                                { mode: 'custom', apiKey: editKey.trim(), endpoint: editEndpoint.trim(), model: editModel.trim() }
                                                            );
                                                            setConfigTestStatus(prev => ({ ...prev, [cfg.id]: 'connected' }));
                                                        } catch (e) {
                                                            setConfigTestStatus(prev => ({ ...prev, [cfg.id]: 'failed' }));
                                                            window.githubStarsAPI.showNotification?.(`连接失败: ${(e as Error).message}`);
                                                        }
                                                    }}>测试连接</button>
                                                    <button className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} disabled={isActive} onClick={() => saveSettings({ aiConfig: { mode: 'custom', endpoint: cfg.endpoint, apiKey: cfg.apiKey, model: cfg.model } })}>
                                                        {isActive ? '已启用' : '启用'}
                                                    </button>
                                                </div>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 12, textAlign: 'center' }} onClick={() => {
                                                    const newList = (settings.savedAIConfigs || []).filter(c => c.id !== cfg.id);
                                                    saveSettings({ savedAIConfigs: newList });
                                                    if (isActive) saveSettings({ aiConfig: { mode: 'utools' } });
                                                    setExpandedConfigId(null);
                                                }}>删除配置</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* 新建自定义 API 配置 */}
                            <div className="card">
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Plus size={14} /> 新建自定义 API
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <input className="input" style={{ fontSize: 13 }} placeholder="API Endpoint (如 https://api.deepseek.com)" value={customEndpoint} onChange={e => setCustomEndpoint(e.target.value)} />
                                    <input className="input" style={{ fontSize: 13 }} placeholder="API Key" type="password" value={customKey} onChange={e => setCustomKey(e.target.value)} />
                                    <input className="input" style={{ fontSize: 13 }} placeholder="模型 (如 gpt-4o-mini)" value={customModel} onChange={e => setCustomModel(e.target.value)} />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ width: '100%' }}
                                        disabled={!customEndpoint.trim() || !customKey.trim() || !customModel.trim()}
                                        onClick={() => {
                                            const newCfg = {
                                                id: `ai-${Date.now()}`,
                                                name: customModel.trim(),
                                                endpoint: customEndpoint.trim(),
                                                apiKey: customKey.trim(),
                                                model: customModel.trim(),
                                            };
                                            saveSettings({ savedAIConfigs: [...(settings.savedAIConfigs || []), newCfg] });
                                            setCustomEndpoint(''); setCustomKey(''); setCustomModel('');
                                        }}
                                    >
                                        保存配置
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ===== 嵌入 ===== */}
                    {activeTab === '嵌入' && (
                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Zap size={14} /> Embedding 配置
                                {embeddingStatus === 'connected' && <span style={{ fontSize: 12, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> 已连接</span>}
                                {embeddingStatus === 'failed' && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>连接失败</span>}
                                {embeddingStatus === 'testing' && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}><Loader2 size={12} className="animate-spin" /> 测试中...</span>}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <select className="input" style={{ fontSize: 13 }} value={settings.embeddingConfig?.provider || ''} onChange={e => { saveSettings({ embeddingConfig: { provider: e.target.value as any, apiKey: '', model: '', ...(settings.embeddingConfig || {}) } }); setEmbeddingStatus('idle'); }}>
                                    <option value="">选择 Provider</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="siliconflow">硅基流动</option>
                                    <option value="ollama">Ollama (本地)</option>
                                    <option value="compatible">兼容格式</option>
                                </select>
                                {settings.embeddingConfig?.provider && (
                                    <>
                                        <input className="input" style={{ fontSize: 13 }} placeholder="API Key (Ollama 可空)" type="password" value={settings.embeddingConfig?.apiKey || ''} onChange={e => { saveSettings({ embeddingConfig: { ...settings.embeddingConfig!, apiKey: e.target.value } }); setEmbeddingStatus('idle'); }} />
                                        <input className="input" style={{ fontSize: 13 }} placeholder="模型 (如 text-embedding-3-small)" value={settings.embeddingConfig?.model || ''} onChange={e => { saveSettings({ embeddingConfig: { ...settings.embeddingConfig!, model: e.target.value } }); setEmbeddingStatus('idle'); }} />
                                        {settings.embeddingConfig?.provider !== 'ollama' && (
                                            <input className="input" style={{ fontSize: 13 }} placeholder="自定义端点 (可选)" value={settings.embeddingConfig?.endpoint || ''} onChange={e => saveSettings({ embeddingConfig: { ...settings.embeddingConfig!, endpoint: e.target.value } })} />
                                        )}
                                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                                            setEmbeddingStatus('testing');
                                            const result = await window.githubStarsAPI.testEmbeddingConnection(settings.embeddingConfig!);
                                            setEmbeddingStatus(result.success ? 'connected' : 'failed');
                                        }}>测试连接</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== 标签 ===== */}
                    {activeTab === '标签' && (
                        <>
                            <DimensionManager dimensions={dimensions} setDimensions={setDimensions} />
                            {/* AI 附加指令 */}
                            <div className="card">
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>AI 分析附加指令</h3>
                                <textarea className="input" style={{ fontSize: 13, minHeight: 60, resize: 'vertical' }} placeholder="可选：给 AI 分析的额外指令（如优先考虑 README 的 Features 部分）" value={settings.aiExtraInstruction || ''} onChange={e => saveSettings({ aiExtraInstruction: e.target.value })} />
                            </div>
                        </>
                    )}

                    {/* ===== 数据 ===== */}
                    {activeTab === '数据' && (
                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>数据管理</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary" onClick={handleExport} style={{ flex: 1 }}><Download size={14} />{t('exportData', lang)}</button>
                                <button className="btn btn-secondary" onClick={handleImport} style={{ flex: 1 }}><Upload size={14} />{t('importData', lang)}</button>
                            </div>
                        </div>
                    )}

                    {/* ===== 关于 ===== */}
                    {activeTab === '关于' && (
                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t('about', lang)}</h3>
                            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                StarsHub<br />
                                {t('version', lang)}: 1.0.0<br />
                                <a href="#" onClick={(e) => { e.preventDefault(); window.githubStarsAPI.openExternal(projectRepositoryUrl); }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                    项目地址
                                </a>
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

/** 标签维度管理组件 */
const DimensionManager: React.FC<{
    dimensions: import('../types').Dimension[];
    setDimensions: (dims: import('../types').Dimension[]) => void;
}> = ({ dimensions, setDimensions }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [newDimName, setNewDimName] = useState('');
    const [newDimDesc, setNewDimDesc] = useState('');
    const [newOpts, setNewOpts] = useState<Record<string, { name: string; desc: string }>>({});

    const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const addDimension = () => {
        if (!newDimName.trim()) return;
        const newDim: import('../types').Dimension = {
            id: `dim-${Date.now()}`, name: newDimName.trim(), description: newDimDesc.trim(),
            options: [], order: dimensions.length,
        };
        setDimensions([...dimensions, newDim]);
        setNewDimName(''); setNewDimDesc('');
    };

    const deleteDimension = (id: string) => setDimensions(dimensions.filter(d => d.id !== id));

    const addOption = (dimId: string) => {
        const opt = newOpts[dimId];
        if (!opt?.name?.trim()) return;
        setDimensions(dimensions.map(d => d.id !== dimId ? d : {
            ...d, options: [...d.options, { id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: opt.name.trim(), description: opt.desc.trim() }],
        }));
        setNewOpts(prev => ({ ...prev, [dimId]: { name: '', desc: '' } }));
    };

    const deleteOption = (dimId: string, optId: string) => {
        setDimensions(dimensions.map(d => d.id !== dimId ? d : { ...d, options: d.options.filter(o => o.id !== optId) }));
    };

    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>标签维度管理</h3>
            {dimensions.map(dim => (
                <div key={dim.id} style={{ marginBottom: 8, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', background: 'var(--color-surface-secondary)' }} onClick={() => toggleExpand(dim.id)}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{dim.name}</span>
                        {dim.isFixed && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>(固定)</span>}
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dim.options.length} 个选项</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: 12 }}>{expanded[dim.id] ? '▼' : '▶'}</span>
                        {!dim.isFixed && <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--color-error)', padding: '2px 6px' }} onClick={(e) => { e.stopPropagation(); deleteDimension(dim.id); }}>删除</button>}
                    </div>
                    {expanded[dim.id] && (
                        <div style={{ padding: '8px 12px' }}>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>{dim.description}</p>
                            {dim.options.map(opt => (
                                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 12 }}>
                                    <span style={{ fontWeight: 500 }}>{opt.name}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>-- {opt.description}</span>
                                    {!dim.isFixed && <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 11 }} onClick={() => deleteOption(dim.id, opt.id)}>✕</button>}
                                </div>
                            ))}
                            {!dim.isFixed && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
                                    <input className="input" style={{ fontSize: 12, padding: '3px 6px', width: 100 }} placeholder="选项名" value={newOpts[dim.id]?.name || ''} onChange={e => setNewOpts(prev => ({ ...prev, [dim.id]: { ...prev[dim.id] || { name: '', desc: '' }, name: e.target.value } }))} />
                                    <input className="input" style={{ fontSize: 12, padding: '3px 6px', flex: 1 }} placeholder="选项描述（让 AI 理解边界）" value={newOpts[dim.id]?.desc || ''} onChange={e => setNewOpts(prev => ({ ...prev, [dim.id]: { ...prev[dim.id] || { name: '', desc: '' }, desc: e.target.value } }))} />
                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => addOption(dim.id)}>+ 添加</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
                <input className="input" style={{ fontSize: 12, padding: '3px 6px', width: 100 }} placeholder="维度名" value={newDimName} onChange={e => setNewDimName(e.target.value)} />
                <input className="input" style={{ fontSize: 12, padding: '3px 6px', flex: 1 }} placeholder="维度描述（如：这个项目所属的技术领域）" value={newDimDesc} onChange={e => setNewDimDesc(e.target.value)} />
                <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={addDimension}>+ 新建维度</button>
            </div>
        </div>
    );
};
