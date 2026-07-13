# StarsHub 架构说明

> uTools GitHub 星标管理插件 —— 以维度标签、视图、语义搜索为核心的下一代 Stars 管理体验

## 一、项目概述

StarsHub 是一个 uTools 插件，用于管理 GitHub 星标仓库。基于 `github-stars-manager-for-utools` 改造，保留其成熟的同步/存储/详情页基础，在标签体系、搜索方式、趋势发现三个维度做了重新设计。

**与源项目的核心区别**：

| 维度 | 源项目 | StarsHub |
|---|---|---|
| 分类方式 | 默认分类（AI 自动归类，常分错）+ 扁平标签 | 用户自定义维度标签（AI 约束式选择） |
| 浏览方式 | 分类列表 | 视图（标签组合过滤器） |
| 搜索方式 | 关键词 | 关键词 + 语义搜索（本地向量，无需外部服务） |
| 趋势发现 | 无 | GitHub Search API + AI 匹配关注重点 |
| 布局 | 顶部 Tab 导航 | 左侧边栏（视图/操作/功能三段式） |
| AI 后端 | 仅 utools.ai() | 可切换 utools.ai() / 自定义 API |
| GitHub 操作 | 只读 | 增加了 star/unstar |

---

## 二、功能列表

### 1. 仓库页（核心页面）

**侧边栏**（三段式固定布局，操作区+功能区固定在底部）：
- **视图区**（顶部）：全部仓库（带数量 badge）+ 自定义视图列表（带数量 badge）+ 新建视图（弹框选维度+选项）
- **操作区**（底部固定）：同步（拉取 starred 仓库）、索引（向量索引重建/增量）、AI 分析（增量/全量分析，全量需确认）
- **功能区**（底部固定）：发布、趋势、设置

**工具栏**（定制栏）：
- 精确搜索框（宽，占满剩余空间，带清除按钮）
- 右侧图标按钮组：语义搜索开关(⚡)、标签维度筛选(Tag)、语言筛选(Code2)、排序(ArrowDownUp)、视图模式切换(List/LayoutGrid)
- 所有筛选用图标按钮+弹出下拉，激活时变色

**uTools 子输入框**：快速搜索模式，自动聚焦，键盘上下选择，enter 打开 GitHub 网址

**搜索逻辑**：
- 关键词搜索：项目名 + AI 分析结果（aiSummary + 维度标签），大小写无关，实时筛
- 语义搜索：工具栏 ⚡ 按钮切换，开启后调 embedding API + 本地 cosine 相似度，结果与关键词融合
- 语义搜索候选集跟随侧边栏选中项（全部仓库=全局，某视图=局部）

### 2. 发布页（Releases）

双 Tab：版本更新 / 订阅管理

**版本更新 Tab**：
- 检查更新（增量拉取订阅仓库的最新 Release，并发 3/批）
- 全文搜索（仓库名/tag/release body）
- AI 总结 Release notes（区分新功能/Bug 修复）
- 日志 Markdown 渲染 + 智能截断（按段落截断 500 字符）
- 资产展开（文件名/大小/下载次数 + 下载 + 复制链接）
- 资产过滤（平台预设 8 类 + 文件类型 + 自定义关键词规则）
- 视图模式（按日期 / 按仓库分组）
- 显示模式（全部 / 仅未读）、最新模式（全部 / 仅最新）
- pre-release 开关、分页（20/50/100/200）
- 已读/未读跟踪（多触发时机）

**订阅管理 Tab**：已订阅列表、取消订阅（5 秒撤销）、全部取消（确认弹窗）

### 3. 趋势页（Trending）

- 数据源：GitHub Search API（`created:>$date sort=stars`），可按语言/Star 下限/时间窗口筛选
- 关注重点管理：预设关键词或一句话（如"向量检索""边缘计算"）
- AI 匹配：对拉取的趋势仓库，AI 判断哪些匹配关注重点 + 匹配理由
- 匹配标注：匹配的仓库高亮/置顶，显示匹配理由
- 仓库卡片操作：AI 分析、加入订阅、star/unstar、打开 GitHub
- 结果缓存（GitHub Search API rate limit 较严）

### 4. 详情页（Detail）

复用源项目 DetailPage，改造 3 处：
- **维度标签替代 aiTags**：AI 分析时在用户定义的维度选项里约束式选择
- **star/unstar**：顶部栏新增按钮，调 GitHub API
- **找相似**：调 embedding + cosine 找语义相似仓库

保留功能：仓库信息头、描述、AI 分析（summary 自由发挥 + 平台 8 固定选项）、别名、笔记（Markdown）、自定义标签、Release 订阅、Topics（GitHub 自带）、Homepage、键盘导航

### 5. 设置页（Settings）

分组组织：
- **通用**：GitHub Token 配置验证、主题、每页数量
- **AI 后端**：切换 utools.ai() / 自定义（Key+端点+模型+连接测试）
- **Embedding**：provider/key/model/维度 + 连接测试 + 索引状态
- **标签维度**：维度管理（增删维度+选项+描述），平台为固定维度
- **视图管理**：视图增删改（视图=维度+选项组合，先做 AND），拖拽排序
- **关注重点**：趋势页关键词/语句管理
- **版本订阅**：订阅仓库列表管理
- **数据**：导入/导出/清除/重置

---

## 三、设计哲学

### 1. 维度标签替代默认分类 —— 把分类权交给用户

**问题**：源项目用 AI 自动归类到默认分类，常分错，且分类维度单一固定，无法适配不同用户的关注角度。

**设计**：用户自定义"维度"，每个维度有多个"选项"。例如：
- 领域维度：AI / 工具 / 框架 / 库 / 应用
- 类型维度：库 / 应用 / 服务 / 工具
- 平台维度：mac / windows / linux / ios / android / docker / web / cli（固定）

AI 分析时，把所有维度的所有选项（含描述）组装进 prompt，让 AI 在这些选项里约束式选择，而不是自由生成标签。

**为什么**：
- 默认分类的"错"无法修正——用户不知道 AI 为什么这么分，也无法调整分类标准
- 维度标签的"错"可修正——标签是结构化的、可枚举的，打错能手动改，维度和选项用户自己定义
- 维度标签可组合——"领域=AI AND 类型=库"比单一分类表达力强得多
- AI 约束式选择比自由生成更可控——选项有描述，AI 知道每个选项的边界

### 2. 视图 = 标签组合 —— 浏览即过滤

**问题**：源项目的分类是"仓库属于哪个分类"的一对多关系，无法表达"我想看 AI 领域的 Python 库"这种多维组合。

**设计**：视图是用户定义的标签组合过滤器。例如"AI Python 库"视图 = 领域=AI AND 语言=Python AND 类型=库。点侧边栏的视图，内容区立即切到该视图筛选的仓库子集。

**为什么**：
- 视图是"我持续关心的维度组合"，应该是稳定的、可组合的、可修正的——标签天然适合
- 视图定义纯标签，语义搜索不进视图定义——避免"两道 AI 叠加导致准确性下降"
- 视图内可做语义搜索（二级操作），但语义是临时 refinement，不固化进视图

### 3. 语义搜索本地化 —— 摆脱外部服务依赖

**问题**：GithubStarsManager 的语义搜索必须部署 Cloudflare Worker + 配置 Vectorize 索引 + 配置认证 token，设置极其繁琐。

**设计**：利用 uTools preload.js 运行在 Node.js 环境（无 CORS 限制），直接调 embedding API，向量存 utools.db 分片（每分片 <1MB），搜索时在 JS 里做 brute-force cosine 相似度。

**为什么**：
- preload.js 是 Node.js 环境，可发任意 HTTPS 请求，绕过浏览器 CORS——这是 Web 应用需要 Cloudflare Worker 的根本原因，uTools 插件天然没有这个问题
- utools.db 单文档 1MB 限制，分片存储（复用源项目已有的 `saveStoredRepos` 分片模式），2000 个 1536 维向量约 30MB，分 20-30 个分片文档
- brute-force cosine 对 1000-2000 个向量约 10-30ms，个人用户量级完全够用，不需要 ANN 索引
- 零外部服务、零部署成本，用户只需在设置里填 embedding API Key

### 4. 关键词 + 语义协作 —— 两种搜索不是替代而是互补

**问题**：用户需要两种搜索——"我知道名字"用关键词快，"我记不清意图"用语义准。如何让两者共存？

**设计**：
- **uTools 子输入框** = 快速关键词搜索（自动聚焦，实时筛，enter 打开 GitHub）
- **工具栏精确搜索框** = 配合筛选按钮逐步筛选，可触发语义搜索
- **关键词 0 结果自动转语义**（embedding API 免费，自动 fallback）
- **语义搜索候选集跟随侧边栏选中项**（全部仓库=全局，某视图=局部）

**为什么**：
- 关键词实时（本地 <10ms，零 API 成本），语义有延迟（embedding API 500ms-2s）
- 关键词擅长精确名字，语义擅长模糊意图
- 两者结果融合（关键词+语义都命中排最前），用户一次看到全部相关仓库
- 不让用户二选一——两种搜索各有入口，按需使用

### 5. 趋势联动关注重点 —— 不是逛榜单而是主动发现

**问题**：GithubStarsManager 有 5 个"频道"（Trending/Hot Release/Most Popular/Topic/Search），对个人用户太重，且趋势和个人关注点脱节。

**设计**：只保留一个趋势页，数据源用 GitHub Search API（`created:>$date sort=stars`），可按语言/Star 下限/时间窗口精确过滤。用户预设"关注重点"（关键词或一句话），每次拉取趋势后用 AI 判断哪些匹配关注重点 + 匹配理由，匹配的特殊标注。

**为什么**：
- 个人用户关心的是"和我关注点是否匹配"，不是"它涨多快"——Search API 的"近期热门"比 Trending RSS 的"涨得快"更实用
- Search API 官方稳定、可精确过滤、结果可复现，不依赖第三方 RSS
- AI 匹配关注点把"被动逛榜单"变成"主动发现相关项目"——趋势仓库 + 关注点 = 个性化的发现引擎

### 6. 双 AI 后端 —— 开箱即用与灵活定制的平衡

**问题**：utools.ai() 开箱即用但模型不可换、不支持 embedding；自定义 API 灵活但要用户配置。

**设计**：分析类（打标签/特色分析/趋势匹配/Release 总结）默认走 utools.ai()，设置里可切换自定义 API。embedding 永远走自定义（utools.ai() 没有 embedding 接口）。

**为什么**：
- 新用户零配置即可用（utools.ai() 默认）
- 高级用户可切换自定义 API（灵活）
- embedding 是硬约束——utools.ai() 没有 embedding 接口，必须自建

### 7. 侧边栏布局 —— 窄高型窗口的空间优化

**问题**：uTools 窗口是窄高型，顶部 Tab 导航会吃掉宝贵的垂直空间，且分类/视图列表无法常驻可见。

**设计**：左侧边栏三段式固定布局：
- 视图区（上半）：全部仓库 + 自定义视图（带数量 badge）
- 操作区（中部）：同步、索引、AI 分析（带进行中标识）
- 功能区（下部）：发布、趋势、设置

**为什么**：
- 窄高型窗口左右压缩能接受，上下压缩视图很窄很难受
- 侧边栏让视图常驻可见可切，不需要额外点开分类面板
- 三段式分组（视图/操作/功能）有大标题，结构清晰
- 操作区放同步/索引/分析三个按钮，点击弹菜单直接操作，不跳设置页

---

## 四、技术架构

### 技术栈（与源项目一致）
- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- Zustand 5（状态管理）
- lucide-react（图标）
- @dnd-kit（拖拽排序）

### 运行环境
- **前端**：React 应用，运行在 uTools 插件窗口（Electron 渲染进程）
- **preload.js**：Node.js 环境，无 CORS 限制，可调任意 HTTPS API
- **存储**：utools.db（1MB/文档限制，分片存储）/ utools.dbCryptoStorage（加密存储 token/设置）

### 数据流
```
GitHub API ──> preload.js (Node.js) ──> utools.db (分片存储)
                                          │
                                          ├── 仓库数据 (gh:repos:shard:*)
                                          ├── 标签维度 (gh:dimensions)
                                          ├── 视图定义 (gh:views)
                                          ├── 向量索引 (gh:vectors:shard:*)
                                          ├── Release 数据 (gh:releases)
                                          ├── 关注重点 (gh:focusPoints)
                                          └── 设置/Token (utools.dbCryptoStorage)
                                          │
                                    React 前端 (Zustand store)
                                          │
                                    ├── 侧边栏（视图切换/操作/功能导航）
                                    ├── 工具栏（搜索/筛选/视图模式）
                                    └── 内容区（仓库列表/发布/趋势/设置/详情）
```

### AI 调用链
```
分析类（打标签/特色/趋势匹配/Release总结）
  ├── 默认：utools.ai() ──> uTools 平台 AI（能量点计费）
  └── 可选：自定义 API ──> preload.js HTTPS 请求 ──> OpenAI/兼容 API

Embedding（语义搜索）
  └── 必须：自定义 API ──> preload.js HTTPS 请求 ──> embedding provider
                                                        │
                                                  向量存 utools.db 分片
                                                        │
                                                  JS 端 cosine 相似度
```

---

## 五、数据模型概述

### 核心实体

**Repository（仓库）**：
- GitHub 原生字段：id, name, fullName, description, language, topics, stargazersCount, forksCount, htmlUrl...
- AI 生成字段：aiSummary（自由发挥项目特色）, aiPlatforms（8 固定平台）, analyzedAt, analysisFailed
- 维度标签字段：dimensionTags（`{维度ID: [选项ID...]}`，AI 约束式选择 + 用户可修正）
- 用户字段：alias, customTags（旧标签兼容）, notes

**Dimension（维度）**：
- id, name, description, isFixed（平台维度固定）
- options: Option[]（选项列表）

**Option（选项）**：
- id, name, description（描述让 AI 理解选项边界）

**View（视图）**：
- id, name, filters（维度+选项组合，AND 关系）, order

**VectorIndex（向量索引元数据）**：
- sharded, totalShards, shardPrefix, dimensions, model, formatVersion, builtAt

**FocusPoint（关注重点）**：
- id, content（关键词或一句话）

### 存储键设计
```
gh:repos:meta           仓库分片元数据
gh:repos:shard:0..N     仓库分片数据
gh:settings             设置（加密存储）
gh:token                GitHub Token（加密存储）
gh:syncState            同步状态
gh:dimensions           标签维度定义
gh:views                视图定义
gh:vectors:meta         向量索引元数据
gh:vectors:shard:0..N   向量分片数据
gh:releases             Release 数据
gh:releaseSubscriptions 订阅仓库 ID 列表
gh:readReleases         已读 Release ID 列表
gh:focusPoints          关注重点
gh:note:{repoId}        仓库笔记
```

---

## 六、页面结构布局

```
┌──────────────────────────────────────────────────┐
│ [uTools 子输入框 - 快速搜索+选择+enter打开GitHub] │  ← 平台原生
├──────────┬───────────────────────────────────────┤
│ 视图     │ [🔍精确搜索][🏷标签▾][💻语言▾][📦平台▾]│  ← 工具栏
│ ★全部 234│  排序▾  ☰▢                            │
│ 视图1   12├───────────────────────────────────────┤
│ 视图2    8│                                       │
│ +新建     │       内容区                          │
│ ─────     │     (根据侧边栏选中项切换)            │
│ 操作     │                                       │
│ 🔄同步    │                                       │
│ 🧠索引    │                                       │
│ ✨分析    │                                       │
│ ─────     │                                       │
│ 功能     │                                       │
│ 📦发布 3 │                                       │
│ 📈趋势    │                                       │
│ ⚙设置     │                                       │
└──────────┴───────────────────────────────────────┘
```

**侧边栏选中项 -> 内容区映射**：
- 全部仓库 / 某视图 → 仓库列表（该视图筛选的子集）
- 发布 → ReleasesPage
- 趋势 → TrendingPage
- 设置 → SettingsPage
- 仓库卡片点击 → DetailPage（覆盖上层，返回回原页面）

---

## 七、改造范围（相对源项目）

### 保留（直接复用）
- 同步逻辑（getStarredReposPage + Link header 分页 + patchRepos 增量）
- 分片存储模式（saveStoredRepos/loadStoredRepos）
- 详情页基础结构（仓库信息/别名/笔记/订阅/Topics/Homepage/键盘导航）
- Release 订阅/检查更新/已读未读
- 主题系统、Token 管理

### 改造
- preload.js：新增 star/unstar、embedding API、自定义 AI、向量分片存储、Search API
- types：新增维度标签系统、视图、向量索引、关注重点类型
- App.tsx：顶部 Tab → 左侧边栏三段式布局
- HomePage：新增侧边栏 + 工具栏（精确搜索+筛选+视图模式）
- DetailPage：aiTags → dimensionTags，新增 star/unstar + 找相似
- ReleasesPage：补全全文搜索/AI总结/日志渲染/视图模式/分页/pre-release
- SettingsPage：重构为分组（AI后端/Embedding/标签维度/视图管理/关注重点）

### 新增
- TrendingPage（趋势页）
- vectorService（向量索引+搜索）
- embeddingService（embedding API 调用）
- trendingService（Search API + AI 匹配）
- Sidebar 组件（三段式侧边栏）
- Toolbar 组件（工具栏）

### 删除
- TagsPage（标签管理合并进设置页）
- 扁平 Tag 系统（替换为维度标签系统）
- 默认分类系统
