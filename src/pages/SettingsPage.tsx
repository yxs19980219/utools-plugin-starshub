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
    Sun, Moon, Monitor, Globe, Sparkles, Play, StopCircle, Zap, Bell
} from 'lucide-react';

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
    const [tokenInput, setTokenInput] = useState(token || '');
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<'success' | 'error' | null>(null);
    const [aiModels, setAiModels] = useState<any[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [tokenHelpExpanded, setTokenHelpExpanded] = useState(false);
    const autoSyncTimerRef = useRef<number | null>(null);

    useEffect(() => {
        loadAIModels();
    }, []);

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

        logger.log('[AutoSync] Token 验证成功，准备触发自动同步', {
            syncStatus,
            willSync: syncStatus !== 'syncing'
        });

        if (syncStatus === 'syncing') {
            return;
        }

        if (autoSyncTimerRef.current !== null) {
            window.clearTimeout(autoSyncTimerRef.current);
        }

        // 延迟触发同步，让用户先看到验证成功状态
        autoSyncTimerRef.current = window.setTimeout(() => {
            autoSyncTimerRef.current = null;
            logger.log('[AutoSync] 触发 trigger-sync 事件');
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
        const data = {
            version: '1.4.0',
            exportedAt: new Date().toISOString(),
            repositories,
            settings,
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `github-stars-backup-${Date.now()}.json`;
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
                    if (data.repositories) {
                        setRepositories(data.repositories);
                        saveRepositories();
                    }
                    if (data.settings) {
                        saveSettings(data.settings);
                    }
                    window.githubStarsAPI.showNotification(
                        lang === 'zh' ? '数据导入成功' : 'Data imported successfully'
                    );
                } catch {
                    window.githubStarsAPI.showNotification(
                        lang === 'zh' ? '导入失败：文件格式错误' : 'Import failed: invalid file format'
                    );
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
            }}>
                <button className="btn btn-ghost btn-sm" onClick={handleBack}>
                    <ArrowLeft size={16} />
                    {t('back', lang)}
                </button>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t('settings', lang)}</h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="animate-fade-in">
                {/* GitHub Token */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Key size={14} style={{ color: 'var(--color-primary)' }} />
                        {t('githubToken', lang)}
                        <TokenHelpHeaderButton
                            lang={lang}
                            expanded={tokenHelpExpanded}
                            onToggle={() => setTokenHelpExpanded(!tokenHelpExpanded)}
                        />
                    </h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="password"
                            className="input"
                            value={tokenInput}
                            onChange={(e) => { setTokenInput(e.target.value); setVerifyResult(null); }}
                            placeholder={t('tokenPlaceholder', lang)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleVerifyToken}
                            disabled={verifying || !tokenInput.trim()}
                            style={{ flexShrink: 0 }}
                        >
                            {verifying ? <Loader2 size={14} className="animate-spin" /> : verifyResult === 'success' ? <Check size={14} /> : verifyResult === 'error' ? <X size={14} /> : <Key size={14} />}
                            {t('verifyToken', lang)}
                        </button>
                    </div>
                    {verifyResult && (
                        <p style={{ fontSize: 13, marginTop: 6, color: verifyResult === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {verifyResult === 'success' ? t('tokenVerified', lang) : t('tokenInvalid', lang)}
                        </p>
                    )}

                    {/* Token 帮助面板 - 受控展开 */}
                    <TokenHelp
                        lang={lang}
                        expanded={tokenHelpExpanded}
                        onToggle={() => setTokenHelpExpanded(!tokenHelpExpanded)}
                    />
                </div>

                {/* AI 模型 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                        {lang === 'zh' ? 'AI 模型' : 'AI Model'}
                    </h3>
                    {loadingModels ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
                            <Loader2 size={14} className="animate-spin" />
                            {lang === 'zh' ? '加载模型列表...' : 'Loading models...'}
                        </div>
                    ) : aiModels.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                            {lang === 'zh' ? '未找到可用的 AI 模型，请在 uTools 主设置中配置' : 'No AI models found. Please configure in uTools settings.'}
                        </p>
                    ) : (
                        <div>
                            <select className="input" value={settings.aiModel || ''} onChange={(e) => saveSettings({ aiModel: e.target.value })} style={{ cursor: 'pointer' }}>
                                <option value="">{lang === 'zh' ? '默认模型' : 'Default Model'}</option>
                                {aiModels.map((model: any) => {
                                    const modelId = typeof model === 'string' ? model : (model.id || model.name || String(model));
                                    const modelName = typeof model === 'string' ? model : (model.title || model.label || model.displayName || model.name || (model.id && !model.id.startsWith('aimodels/') ? model.id : null) || model.model || modelId);
                                    return <option key={modelId} value={modelId}>{modelName}</option>;
                                })}
                            </select>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                                {lang === 'zh' ? '选择用于仓库分析的 AI 模型' : 'Select the AI model for repository analysis'}
                            </p>
                        </div>
                    )}
                </div>

                {/* AI 分析设置 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                        {lang === 'zh' ? 'AI 分析设置' : 'AI Analysis Settings'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{lang === 'zh' ? '启动时自动分析' : 'Auto-analyze on startup'}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{lang === 'zh' ? '打开插件时自动分析未分析的仓库，每次分析消耗AI能量' : 'Analyze unanalyzed repos when plugin opens'}</div>
                        </div>
                        <button className={`btn ${settings.autoAnalyzeOnOpen ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ autoAnalyzeOnOpen: !settings.autoAnalyzeOnOpen })} style={{ minWidth: 60 }}>
                            {settings.autoAnalyzeOnOpen ? (lang === 'zh' ? '开' : 'On') : (lang === 'zh' ? '关' : 'Off')}
                        </button>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{lang === 'zh' ? '并发数' : 'Concurrency'}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} className={`btn ${(settings.aiConcurrency || 1) === n ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ aiConcurrency: n })} style={{ flex: 1 }}>{n}</button>
                            ))}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{lang === 'zh' ? '并发数越高分析越快，但可能触发限流' : 'Higher concurrency is faster but may trigger rate limits'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => isAnalyzing ? stopAnalyze() : startAutoAnalyze()} disabled={!token || repositories.length === 0} style={{ flex: 1 }} title={!token ? (lang === 'zh' ? '请先配置 GitHub Token' : 'Please configure GitHub Token first') : repositories.length === 0 ? (lang === 'zh' ? '请先同步仓库' : 'Please sync repositories first') : undefined}>
                            {isAnalyzing ? <><StopCircle size={14} />{lang === 'zh' ? '停止分析' : 'Stop Analysis'}</> : <><Play size={14} />{lang === 'zh' ? '立即分析' : 'Analyze Now'}</>}
                        </button>
                    </div>
                    {!token && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-warning)' }}>{lang === 'zh' ? '⚠️ 请先配置 GitHub Token 以使用 AI 分析功能' : '⚠️ Please configure GitHub Token to use AI analysis'}</div>}
                    {isAnalyzing && analyzeProgress && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{lang === 'zh' ? '正在分析: ' : 'Analyzing: '}{analyzeProgress.currentRepo}</div>
                            <div style={{ height: 4, background: 'var(--color-surface-secondary)', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${Math.round((analyzeProgress.current / analyzeProgress.total) * 100)}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', borderRadius: 2, transition: 'width 0.3s ease' }} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{analyzeProgress.current}/{analyzeProgress.total}</div>
                        </div>
                    )}
                    {!isAnalyzing && repositories.length > 0 && (
                        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {lang === 'zh' ? `已分析: ${repositories.filter(r => r.analyzedAt && !r.analysisFailed).length} / ${repositories.length} 个仓库` : `Analyzed: ${repositories.filter(r => r.analyzedAt && !r.analysisFailed).length} / ${repositories.length} repos`}
                            {repositories.filter(r => r.analysisFailed).length > 0 && <span style={{ color: 'var(--color-error)', marginLeft: 8 }}>({lang === 'zh' ? '失败' : 'Failed'}: {repositories.filter(r => r.analysisFailed).length})</span>}
                        </div>
                    )}
                    {repositories.length === 0 && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>{lang === 'zh' ? '请先同步仓库后再进行分析' : 'Please sync repositories first'}</div>}
                </div>

                {/* 版本追踪设置 🆕 v1.4.0 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Bell size={14} style={{ color: 'var(--color-primary)' }} />
                        {t('releaseSubscription', lang)}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{t('autoCheckUpdates', lang)}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{lang === 'zh' ? '打开插件时自动检查订阅仓库的版本更新' : 'Automatically check for updates on startup'}</div>
                        </div>
                        <button className={`btn ${(settings.autoCheckReleaseUpdates !== false) ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ autoCheckReleaseUpdates: settings.autoCheckReleaseUpdates === false })} style={{ minWidth: 60 }}>
                            {(settings.autoCheckReleaseUpdates !== false) ? (lang === 'zh' ? '开' : 'On') : (lang === 'zh' ? '关' : 'Off')}
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{t('subscribedRepos', lang)}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t('subscribedCount', lang, { count: subscribedCount })}</div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                            setReleasesInitialTab('subscriptions');
                            setCurrentPage('releases');
                        }}>{t('manageSubscriptions', lang)}</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => checkReleaseUpdates()} disabled={releaseCheckStatus.checking || !token || subscribedCount === 0} style={{ flex: 1 }} title={!token ? (lang === 'zh' ? '请先配置 GitHub Token' : 'Please configure GitHub Token first') : subscribedCount === 0 ? (lang === 'zh' ? '请先订阅仓库' : 'Please subscribe to repos first') : undefined}>
                            {releaseCheckStatus.checking ? <><Loader2 size={14} className="animate-spin" />{t('checkingUpdates', lang)}</> : <><Bell size={14} />{t('checkUpdates', lang)}</>}
                        </button>
                    </div>
                    {releaseCheckStatus.lastCheckedAt && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>{t('lastChecked', lang)}: {new Date(releaseCheckStatus.lastCheckedAt).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</div>}
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

                {/* 语言 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={14} />{t('language', lang)}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className={`btn ${settings.language === 'zh' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ language: 'zh' })} style={{ flex: 1 }}>中文</button>
                        <button className={`btn ${settings.language === 'en' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ language: 'en' })} style={{ flex: 1 }}>English</button>
                    </div>
                </div>

                {/* 每页数量 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t('itemsPerPage', lang)}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[10, 20, 50, 100].map((n) => (
                            <button key={n} className={`btn ${settings.itemsPerPage === n ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => saveSettings({ itemsPerPage: n })} style={{ flex: 1 }}>{n}</button>
                        ))}
                    </div>
                </div>

                {/* 🆕 AI 后端配置 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} /> AI 后端
                    </h3>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <button
                            className={`btn ${(settings.aiConfig?.mode || 'utools') === 'utools' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => saveSettings({ aiConfig: { mode: 'utools' } })}
                            style={{ flex: 1 }}
                        >uTools 内置</button>
                        <button
                            className={`btn ${settings.aiConfig?.mode === 'custom' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => saveSettings({ aiConfig: { mode: 'custom', ...(settings.aiConfig || {}) } })}
                            style={{ flex: 1 }}
                        >自定义 API</button>
                    </div>
                    {settings.aiConfig?.mode === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input className="input" style={{ fontSize: 13 }} placeholder="API Endpoint (如 https://api.openai.com/v1/chat/completions)" value={settings.aiConfig?.endpoint || ''} onChange={e => saveSettings({ aiConfig: { ...settings.aiConfig!, endpoint: e.target.value } })} />
                            <input className="input" style={{ fontSize: 13 }} placeholder="API Key" type="password" value={settings.aiConfig?.apiKey || ''} onChange={e => saveSettings({ aiConfig: { ...settings.aiConfig!, apiKey: e.target.value } })} />
                            <input className="input" style={{ fontSize: 13 }} placeholder="模型 (如 gpt-4o-mini)" value={settings.aiConfig?.model || ''} onChange={e => saveSettings({ aiConfig: { ...settings.aiConfig!, model: e.target.value } })} />
                        </div>
                    )}
                </div>

                {/* 🆕 Embedding 配置 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} /> Embedding 配置
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select className="input" style={{ fontSize: 13 }} value={settings.embeddingConfig?.provider || ''} onChange={e => saveSettings({ embeddingConfig: { provider: e.target.value as any, apiKey: '', model: '' , ...(settings.embeddingConfig || {}) } })}>
                            <option value="">选择 Provider</option>
                            <option value="openai">OpenAI</option>
                            <option value="siliconflow">硅基流动</option>
                            <option value="ollama">Ollama (本地)</option>
                            <option value="compatible">兼容格式</option>
                        </select>
                        {settings.embeddingConfig?.provider && (
                            <>
                                <input className="input" style={{ fontSize: 13 }} placeholder="API Key (Ollama 可空)" type="password" value={settings.embeddingConfig?.apiKey || ''} onChange={e => saveSettings({ embeddingConfig: { ...settings.embeddingConfig!, apiKey: e.target.value } })} />
                                <input className="input" style={{ fontSize: 13 }} placeholder="模型 (如 text-embedding-3-small)" value={settings.embeddingConfig?.model || ''} onChange={e => saveSettings({ embeddingConfig: { ...settings.embeddingConfig!, model: e.target.value } })} />
                                {settings.embeddingConfig?.provider !== 'ollama' && (
                                    <input className="input" style={{ fontSize: 13 }} placeholder="自定义端点 (可选)" value={settings.embeddingConfig?.endpoint || ''} onChange={e => saveSettings({ embeddingConfig: { ...settings.embeddingConfig!, endpoint: e.target.value } })} />
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={async () => {
                                    const result = await window.githubStarsAPI.testEmbeddingConnection(settings.embeddingConfig!);
                                    if (result.success) { window.githubStarsAPI.showNotification?.(`连接成功，维度: ${result.dimensions}`); }
                                    else { window.githubStarsAPI.showNotification?.(`连接失败: ${result.error}`); }
                                }}>测试连接</button>
                            </>
                        )}
                    </div>
                </div>

                {/* 🆕 AI 附加指令 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>AI 分析附加指令</h3>
                    <textarea className="input" style={{ fontSize: 13, minHeight: 60, resize: 'vertical' }} placeholder="可选：给 AI 分析的额外指令（如优先考虑 README 的 Features 部分）" value={settings.aiExtraInstruction || ''} onChange={e => saveSettings({ aiExtraInstruction: e.target.value })} />
                </div>

                {/* 🆕 标签维度管理 */}
                <DimensionManager dimensions={dimensions} setDimensions={setDimensions} />

                {/* 导入导出 */}
                <div className="card" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{lang === 'zh' ? '数据管理' : 'Data Management'}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={handleExport} style={{ flex: 1 }}><Download size={14} />{t('exportData', lang)}</button>
                        <button className="btn btn-secondary" onClick={handleImport} style={{ flex: 1 }}><Upload size={14} />{t('importData', lang)}</button>
                    </div>
                </div>

                {/* 关于 */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t('about', lang)}</h3>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        StarsHub<br />
                        {t('version', lang)}: 1.0.0<br />
                        <a href="#" onClick={(e) => { e.preventDefault(); window.githubStarsAPI.openExternal(projectRepositoryUrl); }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                            {lang === 'zh' ? '项目地址' : 'Project Repository'}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

/** 🆕 标签维度管理组件 */
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
            id: `dim-${Date.now()}`,
            name: newDimName.trim(),
            description: newDimDesc.trim(),
            options: [],
            order: dimensions.length,
        };
        setDimensions([...dimensions, newDim]);
        setNewDimName('');
        setNewDimDesc('');
    };

    const deleteDimension = (id: string) => {
        setDimensions(dimensions.filter(d => d.id !== id));
    };

    const addOption = (dimId: string) => {
        const opt = newOpts[dimId];
        if (!opt?.name?.trim()) return;
        setDimensions(dimensions.map(d => {
            if (d.id !== dimId) return d;
            return {
                ...d,
                options: [...d.options, {
                    id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: opt.name.trim(),
                    description: opt.desc.trim(),
                }],
            };
        }));
        setNewOpts(prev => ({ ...prev, [dimId]: { name: '', desc: '' } }));
    };

    const deleteOption = (dimId: string, optId: string) => {
        setDimensions(dimensions.map(d => {
            if (d.id !== dimId) return d;
            return { ...d, options: d.options.filter(o => o.id !== optId) };
        }));
    };

    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>标签维度管理</h3>

            {/* 现有维度列表 */}
            {dimensions.map(dim => (
                <div key={dim.id} style={{ marginBottom: 8, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                    {/* 维度头部 */}
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', background: 'var(--color-surface-secondary)' }}
                        onClick={() => toggleExpand(dim.id)}
                    >
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{dim.name}</span>
                        {dim.isFixed && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>(固定)</span>}
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dim.options.length} 个选项</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: 12 }}>{expanded[dim.id] ? '▼' : '▶'}</span>
                        {!dim.isFixed && (
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: 11, color: 'var(--color-error)', padding: '2px 6px' }}
                                onClick={(e) => { e.stopPropagation(); deleteDimension(dim.id); }}
                            >删除</button>
                        )}
                    </div>

                    {/* 展开后：维度描述 + 选项列表 + 添加选项 */}
                    {expanded[dim.id] && (
                        <div style={{ padding: '8px 12px' }}>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>{dim.description}</p>

                            {/* 选项列表 */}
                            {dim.options.map(opt => (
                                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 12 }}>
                                    <span style={{ fontWeight: 500 }}>{opt.name}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>-- {opt.description}</span>
                                    {!dim.isFixed && (
                                        <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 11 }} onClick={() => deleteOption(dim.id, opt.id)}>✕</button>
                                    )}
                                </div>
                            ))}

                            {/* 添加新选项（非固定维度） */}
                            {!dim.isFixed && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
                                    <input
                                        className="input"
                                        style={{ fontSize: 12, padding: '3px 6px', width: 100 }}
                                        placeholder="选项名"
                                        value={newOpts[dim.id]?.name || ''}
                                        onChange={e => setNewOpts(prev => ({ ...prev, [dim.id]: { ...prev[dim.id] || { name: '', desc: '' }, name: e.target.value } }))}
                                    />
                                    <input
                                        className="input"
                                        style={{ fontSize: 12, padding: '3px 6px', flex: 1 }}
                                        placeholder="选项描述（让 AI 理解边界）"
                                        value={newOpts[dim.id]?.desc || ''}
                                        onChange={e => setNewOpts(prev => ({ ...prev, [dim.id]: { ...prev[dim.id] || { name: '', desc: '' }, desc: e.target.value } }))}
                                    />
                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => addOption(dim.id)}>+ 添加</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* 添加新维度 */}
            <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
                <input
                    className="input"
                    style={{ fontSize: 12, padding: '3px 6px', width: 100 }}
                    placeholder="维度名"
                    value={newDimName}
                    onChange={e => setNewDimName(e.target.value)}
                />
                <input
                    className="input"
                    style={{ fontSize: 12, padding: '3px 6px', flex: 1 }}
                    placeholder="维度描述（如：这个项目所属的技术领域）"
                    value={newDimDesc}
                    onChange={e => setNewDimDesc(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={addDimension}>+ 新建维度</button>
            </div>
        </div>
    );
};
