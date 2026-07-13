const https = require('node:https');

// ==================== GitHub API 封装 ====================
const githubAPI = {
    // 验证 Token
    verifyToken(token) {
        return requestGitHub('/user', token);
    },

    // 获取用户 Starred 仓库（支持 starred_at）
    async getStarredRepos(token, page = 1, perPage = 100) {
        console.log('[GitHub API] Fetching starred repos, page:', page);
        const result = await requestGitHub(
            `/user/starred?page=${page}&per_page=${perPage}&sort=created&direction=desc`,
            token,
            { accept: 'application/vnd.github.star+json' }
        );
        console.log('[GitHub API] Got', Array.isArray(result) ? result.length : 0, 'repos on page', page);
        return result;
    },

    // 获取用户 Starred 仓库分页数据（包含 Link header 元信息）
    async getStarredReposPage(token, page = 1, perPage = 100) {
        console.log('[GitHub API] Fetching starred repos page with meta, page:', page);
        const result = await requestGitHubRaw(
            `/user/starred?page=${page}&per_page=${perPage}&sort=created&direction=desc`,
            token,
            { accept: 'application/vnd.github.star+json' }
        );
        const items = Array.isArray(result.data) ? result.data : [];
        const links = parseGitHubLinkHeader(result.headers.link);
        const hasLinkPagination = links.nextPage !== null || links.lastPage !== null;

        return {
            items,
            page,
            perPage,
            totalPages: links.lastPage,
            hasNext: links.nextPage !== null || (!hasLinkPagination && items.length === perPage),
            nextPage: links.nextPage,
        };
    },

    // 获取仓库 README
    async getReadme(owner, repo, token) {
        try {
            const readme = await requestGitHub(
                `/repos/${owner}/${repo}/readme`,
                token
            );
            return Buffer.from(readme.content, 'base64').toString('utf-8');
        } catch {
            return null;
        }
    },

    // 获取仓库 Releases
    getReleases(owner, repo, token, page = 1, perPage = 30) {
        return requestGitHub(
            `/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`,
            token
        );
    },

    // 获取最新 Release 🆕 v1.4.0
    getLatestRelease(owner, repo, token) {
        return requestGitHub(
            `/repos/${owner}/${repo}/releases/latest`,
            token
        );
    },

    // 检查 API 限流状态
    checkRateLimit(token) {
        return requestGitHub('/rate_limit', token);
    },

    // Star 仓库
    starRepo(owner, repo, token) {
        return requestGitHubRaw(`/user/starred/${owner}/${repo}`, token, { method: 'PUT' })
            .then(result => result.data);
    },

    // Unstar 仓库
    unstarRepo(owner, repo, token) {
        return requestGitHubRaw(`/user/starred/${owner}/${repo}`, token, { method: 'DELETE' })
            .then(result => result.data);
    },

    // 搜索仓库（GitHub Search API）
    searchRepos(query, token, page = 1, perPage = 30) {
        const params = new URLSearchParams({ q: query, sort: 'stars', order: 'desc', page: String(page), per_page: String(perPage) });
        return requestGitHub(`/search/repositories?${params.toString()}`, token);
    }
};

// ==================== HTTP 请求工具 ====================
const zlib = require('node:zlib');
const MAX_REPOS_CHUNK_SIZE = 900 * 1024;
const REPOS_SHARD_KEY_PREFIX = 'gh:repos:shard';

function getReposShardKey(prefix, index) {
    return `${prefix}:${index}`;
}

function getReposShardPrefix(meta) {
    return meta?.shardPrefix || REPOS_SHARD_KEY_PREFIX;
}

function parseGitHubLinkHeader(linkHeader) {
    const result = {
        nextPage: null,
        lastPage: null,
    };

    if (!linkHeader) {
        return result;
    }

    const regex = /<([^>]+)>;\s*rel="([^"]+)"/g;
    let match;

    while ((match = regex.exec(linkHeader)) !== null) {
        try {
            const url = new URL(match[1]);
            const page = Number(url.searchParams.get('page'));
            if (!Number.isFinite(page)) continue;

            if (match[2] === 'next') result.nextPage = page;
            if (match[2] === 'last') result.lastPage = page;
        } catch {
            continue;
        }
    }

    return result;
}

function requestGitHub(path, token, options = {}) {
    return requestGitHubRaw(path, token, options).then(result => result.data);
}

function requestGitHubRaw(path, token, options = {}) {
    return new Promise((resolve, reject) => {
        const method = options.method || 'GET';
        const bodyData = options.body ? JSON.stringify(options.body) : null;
        console.log('[GitHub API] Request:', method, path);
        const reqOptions = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'User-Agent': 'StarsHub-uTools',
                'Authorization': `Bearer ${token}`,
                'Accept': options.accept || 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Accept-Encoding': 'gzip, deflate',
            }
        };

        if (bodyData) {
            reqOptions.headers['Content-Type'] = 'application/json';
            reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
        }

        const req = https.request(reqOptions, (res) => {
            const encoding = res.headers['content-encoding'];
            console.log('[GitHub API] Response status:', res.statusCode, 'encoding:', encoding || 'none');

            let stream = res;
            if (encoding === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (encoding === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            }

            let data = '';
            stream.on('data', chunk => {
                data += chunk.toString();
            });
            stream.on('end', () => {
                console.log('[GitHub API] Response complete, data length:', data.length);
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ data: json, headers: res.headers });
                    } else {
                        console.error('[GitHub API] Error:', res.statusCode, json.message || data.substring(0, 300));
                        reject(new Error(json.message || `HTTP ${res.statusCode}`));
                    }
                } catch (e) {
                    console.error('[GitHub API] Parse error:', e.message, 'data:', data.substring(0, 300));
                    reject(new Error('Invalid JSON response'));
                }
            });
            stream.on('error', (err) => {
                console.error('[GitHub API] Stream error:', err.message);
                reject(err);
            });
        });

        req.on('error', (err) => {
            console.error('[GitHub API] Network error:', err.message);
            reject(err);
        });
        req.setTimeout(30000, () => {
            console.error('[GitHub API] Request timeout after 30s for:', path);
            req.destroy();
            reject(new Error('Request timeout'));
        });
        if (bodyData) {
            req.write(bodyData);
        }
        req.end();
        console.log('[GitHub API] Request sent, waiting for response...');
    });
}

// ==================== 通用 HTTP POST（外部 API 调用） ====================

const http = require('node:http');

/**
 * 通用 HTTP/HTTPS POST 请求，用于调用外部 API（embedding / 自定义 AI）
 * @param {string} url - 完整的请求 URL
 * @param {object} headers - 请求头
 * @param {object|string} body - 请求体
 * @returns {Promise<any>}
 */
function httpPost(url, headers, body) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        const bodyData = typeof body === 'string' ? body : JSON.stringify(body);

        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyData),
                ...headers,
            }
        };

        const req = httpModule.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk.toString(); });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(json.error?.message || json.message || `HTTP ${res.statusCode}`));
                    }
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
                    }
                }
            });
            res.on('error', reject);
        });

        req.on('error', reject);
        req.setTimeout(60000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.write(bodyData);
        req.end();
    });
}

// ==================== 向量分片存储 ====================

const MAX_VECTOR_CHUNK_SIZE = 900 * 1024;
const VECTOR_SHARD_KEY_PREFIX = 'gh:vectors:shard';

function getVectorShardKey(prefix, index) {
    return `${prefix}:${index}`;
}

function getVectorShardPrefix(meta) {
    return meta?.shardPrefix || VECTOR_SHARD_KEY_PREFIX;
}

/**
 * 保存向量数据（分片存储，复用仓库分片模式）
 * @param {Array} vectors - 向量数组 [{ repoId, vector, fullName, indexedAt }, ...]
 */
function saveVectors(vectors) {
    const oldMeta = utools.dbStorage.getItem('gh:vectors:meta');
    const json = JSON.stringify(vectors);

    const chunks = [];
    for (let i = 0; i < json.length; i += MAX_VECTOR_CHUNK_SIZE) {
        chunks.push(json.slice(i, i + MAX_VECTOR_CHUNK_SIZE));
    }

    const nextShardPrefix = `${VECTOR_SHARD_KEY_PREFIX}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    chunks.forEach((chunk, index) => {
        utools.dbStorage.setItem(getVectorShardKey(nextShardPrefix, index), chunk);
    });

    utools.dbStorage.setItem('gh:vectors:meta', {
        sharded: true,
        totalShards: chunks.length,
        shardPrefix: nextShardPrefix,
        dimensions: vectors[0]?.vector?.length || 0,
        count: vectors.length,
        builtAt: Date.now(),
    });

    // 清除旧分片
    if (oldMeta?.totalShards) {
        for (let i = 0; i < oldMeta.totalShards; i++) {
            utools.dbStorage.removeItem(getVectorShardKey(getVectorShardPrefix(oldMeta), i));
        }
    }
}

/**
 * 加载全部向量数据
 * @returns {Array} 向量数组
 */
function loadVectors() {
    const meta = utools.dbStorage.getItem('gh:vectors:meta');
    if (!meta?.sharded) {
        return [];
    }

    const shardPrefix = getVectorShardPrefix(meta);
    const chunks = [];
    for (let i = 0; i < meta.totalShards; i++) {
        const chunk = utools.dbStorage.getItem(getVectorShardKey(shardPrefix, i));
        if (chunk) chunks.push(chunk);
    }

    try {
        return JSON.parse(chunks.join(''));
    } catch (error) {
        console.error('[VectorStorage] 分片数据解析失败:', error);
        return [];
    }
}

/**
 * 清除全部向量数据
 */
function removeVectors() {
    const meta = utools.dbStorage.getItem('gh:vectors:meta');
    if (meta?.totalShards) {
        const shardPrefix = getVectorShardPrefix(meta);
        for (let i = 0; i < meta.totalShards; i++) {
            utools.dbStorage.removeItem(getVectorShardKey(shardPrefix, i));
        }
    }
    utools.dbStorage.removeItem('gh:vectors:meta');
}

// ==================== Embedding API ====================

/**
 * 调用 Embedding API 获取文本向量
 * @param {string} text - 要嵌入的文本
 * @param {object} config - { provider, apiKey, model, endpoint, dimensions }
 * @returns {Promise<number[]>} 向量数组
 */
async function getEmbedding(text, config) {
    const { provider, apiKey, model, endpoint, dimensions } = config;

    let url, headers, body;

    if (provider === 'openai' || provider === 'siliconflow' || provider === 'compatible') {
        url = endpoint || (provider === 'siliconflow'
            ? 'https://api.siliconflow.cn/v1/embeddings'
            : 'https://api.openai.com/v1/embeddings');
        headers = { 'Authorization': `Bearer ${apiKey}` };
        body = { model: model || 'text-embedding-3-small', input: text };
        if (dimensions) body.dimensions = dimensions;
    } else if (provider === 'ollama') {
        url = endpoint || 'http://localhost:11434/api/embeddings';
        headers = {};
        body = { model: model || 'nomic-embed-text', prompt: text };
    } else {
        // 默认走 OpenAI 兼容格式
        url = endpoint || 'https://api.openai.com/v1/embeddings';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        body = { model: model || 'text-embedding-3-small', input: text };
        if (dimensions) body.dimensions = dimensions;
    }

    const result = await httpPost(url, headers, body);

    // 不同 provider 的响应格式
    if (provider === 'ollama') {
        return result.embedding;
    }
    // OpenAI / 兼容格式
    return result.data[0].embedding;
}

/**
 * 测试 Embedding API 连接
 * @param {object} config
 * @returns {Promise<{ success: boolean, dimensions: number, error?: string }>}
 */
async function testEmbeddingConnection(config) {
    try {
        const vector = await getEmbedding('test connection', config);
        return { success: true, dimensions: vector.length };
    } catch (error) {
        return { success: false, dimensions: 0, error: error.message };
    }
}

// ==================== 自定义 AI 调用 ====================

/**
 * 调用自定义 AI API（OpenAI 兼容格式）
 * @param {Array} messages - [{ role, content }, ...]
 * @param {object} config - { apiKey, endpoint, model }
 * @returns {Promise<{ content: string }>} 兼容 utools.ai() 格式
 */
async function customAI(messages, config) {
    const { apiKey, endpoint, model } = config;
    const url = endpoint || 'https://api.openai.com/v1/chat/completions';
    const headers = { 'Authorization': `Bearer ${apiKey}` };
    const body = {
        model: model || 'gpt-4o-mini',
        messages: messages,
    };

    const result = await httpPost(url, headers, body);
    const content = result.choices?.[0]?.message?.content || '';
    return { content };
}

// ==================== 异步辅助函数 (v1.7.0) ====================

function loadStoredRepos() {
    const meta = utools.dbStorage.getItem('gh:repos:meta');
    if (!meta?.sharded) {
        return utools.dbStorage.getItem('gh:repos') || [];
    }

    const shardPrefix = getReposShardPrefix(meta);
    const chunks = [];
    for (let index = 0; index < meta.totalShards; index++) {
        const chunk = utools.dbStorage.getItem(getReposShardKey(shardPrefix, index));
        if (chunk) chunks.push(chunk);
    }

    try {
        return JSON.parse(chunks.join(''));
    } catch (error) {
        console.error('[ReposStorage] 分片数据解析失败:', error);
        return [];
    }
}

function removeRepoShards(totalShards, shardPrefix = REPOS_SHARD_KEY_PREFIX) {
    for (let index = 0; index < totalShards; index++) {
        utools.dbStorage.removeItem(getReposShardKey(shardPrefix, index));
    }
}

function saveStoredRepos(repos) {
    const oldMeta = utools.dbStorage.getItem('gh:repos:meta');
    const json = JSON.stringify(repos);

    if (json.length < MAX_REPOS_CHUNK_SIZE) {
        utools.dbStorage.setItem('gh:repos', repos);
        utools.dbStorage.removeItem('gh:repos:meta');
        if (oldMeta?.totalShards) {
            removeRepoShards(oldMeta.totalShards, getReposShardPrefix(oldMeta));
        }
        return;
    }

    const chunks = [];
    for (let index = 0; index < json.length; index += MAX_REPOS_CHUNK_SIZE) {
        chunks.push(json.slice(index, index + MAX_REPOS_CHUNK_SIZE));
    }

    const nextShardPrefix = `${REPOS_SHARD_KEY_PREFIX}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    chunks.forEach((chunk, index) => {
        utools.dbStorage.setItem(getReposShardKey(nextShardPrefix, index), chunk);
    });

    utools.dbStorage.setItem('gh:repos:meta', {
        sharded: true,
        totalShards: chunks.length,
        shardPrefix: nextShardPrefix,
    });
    utools.dbStorage.removeItem('gh:repos');

    if (oldMeta?.totalShards) {
        removeRepoShards(oldMeta.totalShards, getReposShardPrefix(oldMeta));
    }
}

/**
 * 让出主线程，避免阻塞 UI
 * @returns {Promise<void>}
 */
function yieldToMain() {
    return new Promise(resolve => {
        if (typeof setImmediate !== 'undefined') {
            setImmediate(resolve);
        } else if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(resolve, { timeout: 50 });
        } else {
            setTimeout(resolve, 0);
        }
    });
}

/**
 * 增量更新仓库数据
 * @param {Array} updatedRepos - 要更新的仓库列表
 */
async function patchRepos(updatedRepos) {
    const allRepos = loadStoredRepos();
    const updatedMap = new Map(updatedRepos.map(r => [r.id, r]));

    const merged = allRepos.map(repo =>
        updatedMap.has(repo.id) ? updatedMap.get(repo.id) : repo
    );

    saveStoredRepos(merged);
}

// ==================== 暴露给前端 ====================
window.githubStarsAPI = {
    // GitHub API
    verifyToken: (token) => githubAPI.verifyToken(token),
    getStarredRepos: (token, page, perPage) => githubAPI.getStarredRepos(token, page, perPage),
    getStarredReposPage: (token, page, perPage) => githubAPI.getStarredReposPage(token, page, perPage),
    getReadme: (owner, repo, token) => githubAPI.getReadme(owner, repo, token),
    getRepoReleases: (owner, repo, token, page, perPage) => githubAPI.getReleases(owner, repo, token, page, perPage),
    getLatestRelease: (owner, repo, token) => githubAPI.getLatestRelease(owner, repo, token), // 🆕 v1.4.0
    checkRateLimit: (token) => githubAPI.checkRateLimit(token),

    // 存储操作
    getSettings: () => utools.dbCryptoStorage.getItem('gh:settings') || {},
    setSettings: (settings) => utools.dbCryptoStorage.setItem('gh:settings', settings),
    getToken: () => utools.dbCryptoStorage.getItem('gh:token'),
    setToken: (token) => utools.dbCryptoStorage.setItem('gh:token', token),
    getRepos: () => loadStoredRepos(),
    setRepos: (repos) => saveStoredRepos(repos),
    getSyncState: () => utools.dbStorage.getItem('gh:syncState'),
    setSyncState: (state) => utools.dbStorage.setItem('gh:syncState', state),
    getStoredReleases: () => utools.dbStorage.getItem('gh:releases') || [],
    setStoredReleases: (releases) => utools.dbStorage.setItem('gh:releases', releases),
    getReadReleaseIds: () => utools.dbStorage.getItem('gh:readReleases') || [],
    setReadReleaseIds: (ids) => utools.dbStorage.setItem('gh:readReleases', ids),
    getReleaseSubscriptions: () => utools.dbStorage.getItem('gh:releaseSubscriptions') || [],
    setReleaseSubscriptions: (ids) => utools.dbStorage.setItem('gh:releaseSubscriptions', ids),
    getCategories: () => utools.dbStorage.getItem('gh:categories') || [],
    setCategories: (categories) => utools.dbStorage.setItem('gh:categories', categories),
    getReposMeta: () => utools.dbStorage.getItem('gh:repos:meta'),
    setReposMeta: (meta) => utools.dbStorage.setItem('gh:repos:meta', meta),
    getReposShard: (index) => {
        const meta = utools.dbStorage.getItem('gh:repos:meta');
        return utools.dbStorage.getItem(getReposShardKey(getReposShardPrefix(meta), index));
    },
    setReposShard: (index, data) => utools.dbStorage.setItem(getReposShardKey(REPOS_SHARD_KEY_PREFIX, index), data),
    removeReposShard: (index) => utools.dbStorage.removeItem(getReposShardKey(REPOS_SHARD_KEY_PREFIX, index)),
    removeReposMeta: () => utools.dbStorage.removeItem('gh:repos:meta'),

    // ========== 版本检测状态 🆕 v1.4.0 ==========
    getReleaseCheckStatus: () => utools.dbStorage.getItem('gh:releaseCheckStatus') || {
        lastCheckedAt: null,
        checking: false,
        newCount: 0,
        error: null,
    },
    setReleaseCheckStatus: (status) => utools.dbStorage.setItem('gh:releaseCheckStatus', status),

    // ========== 标签管理 🆕 v1.1.0 ==========
    getTags: () => utools.dbStorage.getItem('gh:tags') || [],

    setTags: (tags) => utools.dbStorage.setItem('gh:tags', tags),

    addTag: (tagData) => {
        const tags = window.githubStarsAPI.getTags();
        const newTag = {
            id: `tag-${Date.now()}`,
            ...tagData,
            order: tags.length,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        tags.push(newTag);
        window.githubStarsAPI.setTags(tags);
        return newTag;
    },

    updateTag: (id, updates) => {
        const tags = window.githubStarsAPI.getTags();
        const index = tags.findIndex(t => t.id === id);
        if (index !== -1) {
            tags[index] = {
                ...tags[index],
                ...updates,
                updatedAt: Date.now()
            };
            window.githubStarsAPI.setTags(tags);
            return tags[index];
        }
        return null;
    },

    /**
     * 删除标签（异步分片版本 v1.7.0）
     * 优化：分片更新 + 让出主线程 + 错误处理
     * @param {string} id - 标签ID
     * @returns {Promise<{updated: number, errors: number}>}
     */
    deleteTag: async (id) => {
        // 1. 删除标签并重新排序（同步操作，很快）
        const tags = window.githubStarsAPI.getTags().filter(t => t.id !== id);
        tags.forEach((t, i) => { t.order = i; });
        window.githubStarsAPI.setTags(tags);

        // 2. 只筛选受影响的仓库
        const repos = window.githubStarsAPI.getRepos();
        const affectedRepos = repos.filter(repo =>
            repo.customTags && repo.customTags.includes(id)
        );

        if (affectedRepos.length === 0) {
            return { updated: 0, errors: 0 };
        }

        // 3. 分片处理
        const CHUNK_SIZE = 50;
        let updatedCount = 0;
        const errors = [];

        for (let i = 0; i < affectedRepos.length; i += CHUNK_SIZE) {
            const chunk = affectedRepos.slice(i, i + CHUNK_SIZE);

            try {
                // 让出主线程，避免阻塞 UI
                await yieldToMain();

                // 更新这一批仓库
                const updatedChunk = chunk.map(repo => ({
                    ...repo,
                    customTags: (repo.customTags || []).filter(t => t !== id),
                    updatedAt: Date.now()
                }));

                // 合并更新
                await patchRepos(updatedChunk);
                updatedCount += updatedChunk.length;
            } catch (error) {
                errors.push({ chunk: i, error });
                // 继续处理其他批次，不中断
                console.error(`[deleteTag] 批次 ${i} 更新失败:`, error);
            }
        }

        if (errors.length > 0) {
            console.error('[deleteTag] 部分批次更新失败:', errors);
        }

        return {
            updated: updatedCount,
            errors: errors.length
        };
    },

    reorderTags: (tagIds) => {
        const tags = window.githubStarsAPI.getTags();
        const tagMap = new Map(tags.map(t => [t.id, t]));
        const reordered = tagIds
            .map(id => tagMap.get(id))
            .filter(Boolean)
            .map((t, i) => ({ ...t, order: i, updatedAt: Date.now() }));
        window.githubStarsAPI.setTags(reordered);
    },

    // ========== 笔记管理 🆕 v1.1.0 ==========
    getNote: (repoId) => {
        return utools.dbStorage.getItem(`gh:note:${repoId}`);
    },

    setNote: (repoId, content) => {
        const existing = window.githubStarsAPI.getNote(repoId);
        const note = {
            id: `note-${repoId}`,
            repoId,
            content,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        utools.dbStorage.setItem(`gh:note:${repoId}`, note);
        return note;
    },

    deleteNote: (repoId) => {
        utools.dbStorage.removeItem(`gh:note:${repoId}`);
    },

    getAllNotes: () => {
        // 通过遍历仓库获取所有笔记
        const repos = loadStoredRepos();
        return repos
            .map(r => window.githubStarsAPI.getNote(r.id))
            .filter(Boolean);
    },

    // ========== 系统操作 ==========
    openExternal: (url) => utools.shellOpenExternal(url),
    showNotification: (body, clickFeatureCode) => utools.showNotification(body, clickFeatureCode),

    // ========== AI 分析 ==========
    // 注意：analyzeRepo 已移至 window.githubStarsAPI 末尾（维度标签版）

    // 获取可用的 AI 模型列表
    getAIModels: async () => {
        try {
            const models = await utools.allAiModels();
            return models;
        } catch (error) {
            console.error('Failed to get AI models:', error);
            return [];
        }
    },

    // ========== Star/Unstar/Search 🆕 ==========
    starRepo: (owner, repo, token) => githubAPI.starRepo(owner, repo, token),
    unstarRepo: (owner, repo, token) => githubAPI.unstarRepo(owner, repo, token),
    searchRepos: (query, token, page, perPage) => githubAPI.searchRepos(query, token, page, perPage),

    // ========== Embedding API 🆕 ==========
    getEmbedding: (text, config) => getEmbedding(text, config),
    testEmbeddingConnection: (config) => testEmbeddingConnection(config),

    // ========== 自定义 AI 🆕 ==========
    customAI: (messages, config) => customAI(messages, config),

    // ========== 向量存储 🆕 ==========
    saveVectors: (vectors) => saveVectors(vectors),
    loadVectors: () => loadVectors(),
    removeVectors: () => removeVectors(),
    getVectorMeta: () => utools.dbStorage.getItem('gh:vectors:meta'),
    setVectorMeta: (meta) => utools.dbStorage.setItem('gh:vectors:meta', meta),

    // ========== 维度标签管理 🆕 ==========
    getDimensions: () => utools.dbStorage.getItem('gh:dimensions') || [],
    setDimensions: (dimensions) => utools.dbStorage.setItem('gh:dimensions', dimensions),

    // ========== 视图管理 🆕 ==========
    getViews: () => utools.dbStorage.getItem('gh:views') || [],
    setViews: (views) => utools.dbStorage.setItem('gh:views', views),

    // ========== 关注重点管理 🆕 ==========
    getFocusPoints: () => utools.dbStorage.getItem('gh:focusPoints') || [],
    setFocusPoints: (focusPoints) => utools.dbStorage.setItem('gh:focusPoints', focusPoints),

    // ========== 维度标签 AI 分析 🆕 ==========
    /**
     * 分析仓库（维度标签版）
     * @param {string} readmeContent - README 内容
     * @param {object} repoInfo - { fullName, description, language }
     * @param {Array} dimensions - 维度定义 [{ id, name, description, options: [{ id, name, description }] }]
     * @param {object} aiConfig - { mode: 'utools'|'custom', apiKey?, endpoint?, model? }
     * @param {string} extraInstruction - 可选的附加指令
     * @returns {Promise<{ summary, dimensions: {}, platforms: [] } | null>}
     */
    analyzeRepo: async (readmeContent, repoInfo, dimensions, aiConfig, extraInstruction) => {
        // 组装维度选项 prompt
        let dimensionText = '';
        for (const dim of dimensions) {
            dimensionText += `\n${dimensions.indexOf(dim) + 1}. ${dim.name}（${dim.description || ''}）\n`;
            for (const opt of dim.options) {
                dimensionText += `   - ${opt.id}: ${opt.name}（${opt.description || opt.name}）\n`;
            }
        }

        // 平台维度固定
        dimensionText += `\n${dimensions.length + 1}. 平台（支持的平台）\n   - mac / windows / linux / ios / android / docker / web / cli\n`;

        const systemPrompt = `你是一个 GitHub 仓库分析专家。请分析以下仓库信息，在每个维度中选择最匹配的标签（可多选），并用一段话描述这个项目的特色。

维度定义：
${dimensionText}

${extraInstruction ? `附加指令：${extraInstruction}\n` : ''}请以 JSON 格式返回:
{
  "summary": "项目特色简述（说明这个项目特别在哪里，自由发挥）",
  "dimensions": {
    "${dimensions[0]?.id || 'dim1'}": ["选项ID"],
    ...
  },
  "platforms": ["mac", "cli"]
}

注意：dimensions 里的 key 是维度 ID，value 是选项 ID 数组。只能从上面列出的选项中选择。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `仓库名称: ${repoInfo.fullName}\n描述: ${repoInfo.description || '无描述'}\n语言: ${repoInfo.language || '未知'}\n\nREADME (前2000字符):\n${readmeContent.substring(0, 2000)}`
            }
        ];

        try {
            let result;
            if (aiConfig?.mode === 'custom' && aiConfig.apiKey) {
                console.log('[AI分析] 使用自定义 AI', { repo: repoInfo.fullName, model: aiConfig.model });
                result = await customAI(messages, aiConfig);
            } else {
                console.log('[AI分析] 使用 utools.ai，能量消耗中...', { repo: repoInfo.fullName, model: aiConfig?.model });
                const aiOptions = { messages };
                if (aiConfig?.model) aiOptions.model = aiConfig.model;
                result = await utools.ai(aiOptions);
            }

            const content = result.content || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        } catch (error) {
            console.error('[AI分析] 调用失败:', error);
            return null;
        }
    }
};
