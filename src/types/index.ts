// ==================== 排序类型 ====================

/**
 * 排序字段
 * @note 'created' 和 'alias' 已在 v1.5.0 移除
 * @since v1.0.0
 */
export type SortBy = 'stars' | 'updated' | 'name' | 'starredAt';

/**
 * 排序方向
 * @since v1.0.0
 */
export type SortOrder = 'asc' | 'desc';

// ==================== 视图模式 ====================
export type ViewMode = 'card' | 'list';

// ==================== 仓库信息 ====================
export interface Repository {
    id: number;
    name: string;
    fullName: string;
    owner: {
        login: string;
        avatarUrl: string;
    };
    description: string | null;
    homepage: string;
    htmlUrl: string;
    language: string | null;
    topics: string[];
    stargazersCount: number;
    forksCount: number;
    createdAt: string;                   // ISO 8601
    updatedAt: string;                   // ISO 8601
    pushedAt: string;                    // ISO 8601
    starredAt?: string;                  // ISO 8601 - 加入星标的时间

    // AI 生成字段
    aiSummary?: string;
    aiTags?: string[];                   // 旧字段，兼容保留
    aiPlatforms?: string[];
    dimensionTags?: Record<string, string[]>;  // 🆕 维度ID -> 选项ID数组
    analyzedAt?: string;                 // ISO 8601
    analysisFailed?: boolean;
    vectorIndexedAt?: string;            // 🆕 向量索引时间 ISO 8601

    // 用户自定义字段 (v1.1.0)
    alias?: string;                      // 用户设置的别名
    customTags: string[];                // 用户自定义标签ID列表 (v1.1.0 必填，默认[])
    userNotes?: string;                  // 用户备注 (兼容旧字段)
    customDescription?: string;
    customCategory?: string;
    isSubscribed?: boolean;

    // 元数据
    lastSyncedAt: number;                // 时间戳
    readmeContent?: string;              // README 内容 (用于 AI 分析，不持久化)
}

// ==================== 标签分组 🆕 v1.1.0 ====================
export interface Tag {
    id: string;                          // 标签唯一ID，格式: tag-${timestamp}
    name: string;                        // 标签名称
    color?: string;                      // 标签颜色 (HEX，如 #3b82f6)
    icon?: string;                       // 标签图标 (emoji 或 lucide 图标名)
    order: number;                       // 排序顺序 (0-based)
    createdAt: number;                   // 创建时间戳
    updatedAt: number;                   // 更新时间戳
}

// ==================== 维度标签系统 🆕 ====================

/** 维度选项 */
export interface DimensionOption {
    id: string;                          // 选项ID
    name: string;                        // 选项名称
    description: string;                 // 选项描述（让 AI 理解选项边界）
}

/** 标签维度 */
export interface Dimension {
    id: string;                          // 维度ID
    name: string;                        // 维度名称（如"领域"、"类型"）
    description: string;                 // 维度说明
    options: DimensionOption[];          // 该维度的选项列表
    isFixed?: boolean;                   // 固定维度（平台维度不可改）
    order: number;                       // 排序顺序
}

// ==================== 视图管理 🆕 ====================

/** 视图过滤器（单个维度的筛选条件） */
export interface ViewFilter {
    dimensionId: string;                 // 维度ID
    optionIds: string[];                 // 选中的选项ID（OR 关系）
}

/** 自定义视图 */
export interface View {
    id: string;                          // 视图ID
    name: string;                        // 视图名称
    filters: ViewFilter[];               // 过滤器列表（AND 关系）
    order: number;                       // 排序顺序
    createdAt: number;                   // 创建时间戳
    updatedAt: number;                   // 更新时间戳
}

// ==================== 向量索引 🆕 ====================

/** 向量索引元数据 */
export interface VectorIndexMeta {
    sharded: boolean;                    // 是否分片
    totalShards: number;                 // 分片总数
    shardPrefix: string;                 // 分片前缀
    dimensions: number;                  // 向量维度数
    count: number;                       // 已索引向量数
    builtAt: number;                     // 构建时间戳
}

/** 单条向量记录 */
export interface VectorRecord {
    repoId: number;                      // 仓库ID
    vector: number[];                    // 向量数据
    fullName: string;                    // 仓库名（用于调试）
    indexedAt: string;                   // 索引时间 ISO 8601
}

// ==================== 关注重点 🆕 ====================

/** 趋势页关注重点 */
export interface FocusPoint {
    id: string;                          // 关注重点ID
    content: string;                     // 关键词或一句话
    createdAt: number;                   // 创建时间戳
}

// ==================== AI / Embedding 配置 🆕 ====================

/** AI 后端配置 */
export interface AIConfig {
    mode: 'utools' | 'custom';           // utools.ai() 或自定义 API
    apiKey?: string;                     // 自定义模式下的 API Key
    endpoint?: string;                   // 自定义模式下的 API 端点
    model?: string;                      // 模型名称
}

/** 保存的自定义 AI 配置（支持多个） */
export interface CustomAIConfig {
    id: string;                          // 配置ID
    name: string;                        // 配置名称（如"OpenAI"、"硅基流动"）
    endpoint: string;                    // API 端点
    apiKey: string;                      // API Key
    model: string;                       // 模型名称
}

/** Embedding 配置 */
export interface EmbeddingConfig {
    provider: 'openai' | 'ollama' | 'siliconflow' | 'compatible';
    apiKey: string;                      // API Key
    model: string;                       // 模型名称
    endpoint?: string;                   // 自定义端点
    dimensions?: number;                 // 向量维度（部分模型支持）
}

// ==================== 笔记 (独立存储) 🆕 v1.1.0 ====================
export interface RepositoryNote {
    id: string;                          // 笔记ID，格式: note-${repoId}
    repoId: number;                      // 关联的仓库ID
    content: string;                     // 笔记内容 (Markdown)
    createdAt: number;                   // 创建时间戳
    updatedAt: number;                   // 更新时间戳
}

// ==================== 版本信息 ====================
export interface Release {
    id: number;
    tagName: string;
    name: string;
    body: string;
    htmlUrl: string;
    publishedAt: string;
    isRead?: boolean;
    assets: ReleaseAsset[];
    repository: {
        id: number;
        fullName: string;
        name: string;
    };
    // GitHub API 原始字段名兼容（用于 API 响应）
    tag_name?: string;
    published_at?: string;
    html_url?: string;
}

export interface ReleaseAsset {
    id: number;
    name: string;
    size: number;
    downloadCount: number;
    browserDownloadUrl: string;
    contentType: string;
    createdAt: string;
    updatedAt: string;
}

// ==================== 配置信息 ====================
export interface Settings {
    githubToken: string;
    syncInterval: number;
    lastSyncTime: number;
    aiModel: string;                     // utools.ai() 模式下的模型
    aiConfig?: AIConfig;                 // 🆕 AI 后端配置（utools/custom 切换）
    savedAIConfigs?: CustomAIConfig[];   // 🆕 保存的自定义 AI 配置列表
    embeddingConfig?: EmbeddingConfig;   // 🆕 Embedding 配置
    aiExtraInstruction?: string;         // 🆕 AI 分析附加指令
    aiConcurrency?: number;
    theme: 'light' | 'dark' | 'auto';
    defaultView: ViewMode;
    itemsPerPage: number;
    language: 'zh' | 'en';               // 保留兼容，默认 zh，UI 不显示切换
    defaultSortBy: SortBy;
    defaultSortOrder: SortOrder;
    autoAnalyzeOnOpen?: boolean;
    autoCheckReleaseUpdates?: boolean;
}

// ==================== 同步状态 ====================
export interface SyncState {
    latestStarredAt: string | null;      // 最新一条 Star 的时间
    latestRepoIds: number[];             // 最新一页中的仓库 ID，用于增量停止判断
    lastSyncAt: number | null;           // 最近一次同步时间
    lastFullSyncAt: number | null;       // 最近一次全量同步时间
}

// ==================== 自定义分类 ====================
export interface Category {
    id: string;
    name: string;
    icon: string;
    keywords: string[];
    isCustom?: boolean;
}

// ==================== 搜索过滤 ====================
export interface SearchFilter {
    keyword: string;
    languages: string[];
    topics: string[];
    aiTags: string[];
    customTags: string[];                // 自定义标签筛选
    platforms: string[];                 // 🆕 v1.3.0 平台筛选
    hasReleases: boolean | null;
    hasNotes: boolean | null;            // 是否有笔记 🆕 v1.1.0
    hasAlias: boolean | null;            // 是否有别名 🆕 v1.1.0
    sortBy: SortBy;
    sortOrder: SortOrder;
}

// ==================== 页面导航 ====================
export type PageName = 'home' | 'detail' | 'settings' | 'releases' | 'trending' | 'tags';

// ==================== 版本检测状态 🆕 v1.4.0 ====================
export interface ReleaseCheckStatus {
    lastCheckedAt: string | null;       // 最后检测时间
    checking: boolean;                   // 是否正在检测
    newCount: number;                    // 新版本数量
    error: string | null;                // 错误信息
}

// ==================== 版本筛选 🆕 v1.4.0 ====================
export interface ReleaseFilter {
    showUnreadOnly: boolean;             // 只显示未读
    platform: string | null;             // 平台过滤
}

// ==================== AI 分析状态 🆕 v1.3.0 ====================
export interface AnalyzeProgress {
    current: number;
    total: number;
    currentRepo: string;
}

export interface AnalyzeStats {
    lastAnalyzeAt: string | null;
    totalAnalyzed: number;
    successCount: number;
    failCount: number;
}

export interface StarredReposPage {
    items: any[];
    page: number;
    perPage: number;
    totalPages: number | null;
    hasNext: boolean;
    nextPage: number | null;
}

// ==================== Window API 类型 ====================
export interface GithubStarsAPI {
    // ========== GitHub API ==========
    verifyToken: (token: string) => Promise<any>;
    getStarredRepos: (token: string, page?: number, perPage?: number) => Promise<any[]>;
    getStarredReposPage: (token: string, page?: number, perPage?: number) => Promise<StarredReposPage>;
    getReadme: (owner: string, repo: string, token: string) => Promise<string | null>;
    getRepoReleases: (owner: string, repo: string, token: string, page?: number, perPage?: number) => Promise<any[]>;
    checkRateLimit: (token: string) => Promise<any>;

    // ========== 存储操作 (dbStorage) ==========
    getSettings: () => Partial<Settings>;
    setSettings: (settings: Partial<Settings>) => void;
    getToken: () => string | null;
    setToken: (token: string) => void;
    getRepos: () => Repository[];
    setRepos: (repos: Repository[]) => void;
    getSyncState: () => SyncState | null;
    setSyncState: (state: SyncState) => void;
    getStoredReleases: () => Release[];
    setStoredReleases: (releases: Release[]) => void;
    getReadReleaseIds: () => number[];
    setReadReleaseIds: (ids: number[]) => void;
    getReleaseSubscriptions: () => number[];
    setReleaseSubscriptions: (ids: number[]) => void;
    getCategories: () => Category[];
    setCategories: (categories: Category[]) => void;

    // ========== 分片存储 ==========
    getReposMeta: () => { sharded: boolean; totalShards: number; shardPrefix?: string } | null;
    setReposMeta: (meta: { sharded: boolean; totalShards: number; shardPrefix?: string }) => void;
    getReposShard: (index: number) => string | null;
    setReposShard: (index: number, data: string) => void;
    removeReposShard: (index: number) => void;
    removeReposMeta: () => void;

    // ========== 标签操作 🆕 v1.1.0 ==========
    getTags: () => Tag[];
    setTags: (tags: Tag[]) => void;
    addTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Tag;
    updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => Tag | null;
    deleteTag: (id: string) => void;
    reorderTags: (tagIds: string[]) => void;

    // ========== 笔记操作 🆕 v1.1.0 ==========
    getNote: (repoId: number) => RepositoryNote | null;
    setNote: (repoId: number, content: string) => RepositoryNote;
    deleteNote: (repoId: number) => void;
    getAllNotes: () => RepositoryNote[];

    // ========== 系统操作 ==========
    openExternal: (url: string) => void;
    showNotification: (body: string, clickFeatureCode?: string) => void;

    // ========== AI 分析 ==========
    analyzeRepo: (
        readmeContent: string,
        repoInfo: { fullName: string; description: string | null; language: string | null },
        dimensions: Dimension[],
        aiConfig?: AIConfig,
        extraInstruction?: string
    ) => Promise<{ summary: string; dimensions: Record<string, string[]>; platforms: string[] } | null>;
    getAIModels: () => Promise<any[]>;

    // ========== 版本检测 🆕 v1.4.0 ==========
    getLatestRelease: (owner: string, repo: string, token: string) => Promise<Release | null>;
    getReleaseCheckStatus: () => ReleaseCheckStatus;
    setReleaseCheckStatus: (status: ReleaseCheckStatus) => void;

    // ========== Star/Unstar/Search 🆕 ==========
    starRepo: (owner: string, repo: string, token: string) => Promise<void>;
    unstarRepo: (owner: string, repo: string, token: string) => Promise<void>;
    searchRepos: (query: string, token: string, page?: number, perPage?: number) => Promise<{ items: any[]; total_count: number }>;

    // ========== Embedding API 🆕 ==========
    getEmbedding: (text: string, config: EmbeddingConfig) => Promise<number[]>;
    testEmbeddingConnection: (config: EmbeddingConfig) => Promise<{ success: boolean; dimensions: number; error?: string }>;

    // ========== 自定义 AI 🆕 ==========
    customAI: (messages: Array<{ role: string; content: string }>, config: AIConfig) => Promise<{ content: string }>;

    // ========== 向量存储 🆕 ==========
    saveVectors: (vectors: VectorRecord[]) => void;
    loadVectors: () => VectorRecord[];
    removeVectors: () => void;
    getVectorMeta: () => VectorIndexMeta | null;
    setVectorMeta: (meta: VectorIndexMeta) => void;

    // ========== 维度标签管理 🆕 ==========
    getDimensions: () => Dimension[];
    setDimensions: (dimensions: Dimension[]) => void;

    // ========== 视图管理 🆕 ==========
    getViews: () => View[];
    setViews: (views: View[]) => void;

    // ========== 关注重点管理 🆕 ==========
    getFocusPoints: () => FocusPoint[];
    setFocusPoints: (focusPoints: FocusPoint[]) => void;
}

declare global {
    interface Window {
        githubStarsAPI: GithubStarsAPI;
    }
}
