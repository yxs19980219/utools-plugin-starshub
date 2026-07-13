# 插件应用目录结构

此部分会帮助你了解，通常情况下，一个插件应用的文件目录结构。

插件应用至少要有一个 `plugin.json` 作为入口，并配置 `logo` 字段以及 `main` 或者 `preload` 字段。

一个相对完整可打包成插件应用的目录可能是这样的：

```shell
/{plugin}
|-- plugin.json
|-- preload.js
|-- index.html
|-- index.js
|-- index.css
|-- logo.png
```

## 源码编译

uTools 仅识别 `html + css + javascript`, 通常我们在开发过程中可能会使用各种的工具来辅助开发，比如 `vite`、`webpack` 等等，也可能会引入各种前端框架，比如 `vue`、`react`、`svelte` 等等，而这些代码并不是直接可以被 uTools 识别的，当我们打包插件应用前应该先将框架代码编译成普通的 html 、css、js 文件。通常是将源码编译输出到 dist 文件夹，然后**将 dist 文件夹打包成插件应用**，切勿将整个项目的根目录打包成插件应用。

## 第三方依赖

当你使用第三方依赖时，根据项目情况进行区分：

当你使用前端依赖时，只需要在项目的根目录下安装即可，对前端项目进行正常的编译，输出到 dist 文件夹。

当你使用 nodejs 的第三方依赖时，应当保证你的模块存在于 `preload.js` 同级目录，并且不要对它们进行编译操作，保证提交插件应用时的目录结构不变，并且源码清晰可读。


# plugin.json 核心配置文件说明

`plugin.json` 是插件应用的核心配置文件，用于定义插件的运行入口、功能指令、匹配指令，以及插件应用与 uTools 的集成方式。每个插件应用都必须包含一个 `plugin.json` 文件。

## 配置文件格式

plugin.json 文件是一个标准的 JSON 文件，它的结构如下：

```json
{
  "main": "index.html",
  "logo": "logo.png",
  "preload": "preload.js",
  "features": [
    {
      "code": "hello",
      "explain": "hello world",
      "cmds": ["hello", "你好"]
    }
  ]
}
```

## 基础字段说明

### `main`

> 类型：`string`
>
> 必填：是

必须指定为相对于 `plugin.json` 的 **相对路径**，且文件类型必须为 `.html`

### `logo`

> 类型：`string`
>
> 必填：是

插件应用 Logo 文件，必须指定为相对于 `plugin.json` 的 **相对路径**

### `preload`

> 类型：`string`
>
> 必填：否

指定一个将在窗口加载前执行的预加载脚本（.js 文件）。该脚本运行在独立的预加载环境，可使用 **Node.js 原生能力** 与 **Electron 渲染进程 API**。

## 插件应用设置字段说明

### `pluginSetting`

> 类型：`object`
>
> 必填：否

插件应用设置，可以配置一些插件应用在基座中的默认行为或者样式。

### `pluginSetting.single`

> 类型：`boolean`
>
> 必填：否
>
> 默认值：`true`

用于控制插件应用是否以单例模式运行。默认为 `true` 。（若无特殊需求，可不配置该字段）

### `pluginSetting.height`

> 类型：`number`
>
> 必填：否
>
> 默认值：`544`

配置插件应用初始高度，可以通过 api `utools.setExpendHeight` 动态修改。（若无特殊需求，可不配置该字段）

## 插件应用功能字段说明

### `features`

> 类型：`Array<object>`
>
> 必填：是
>
> 最小长度：`1`

features 定义插件应用的指令集合，一个插件应用可定义多个功能，一个功能可配置多条指令。

features 的每个元素都是一个 feature 对象，对象中包含以下字段：

### `feature.code`

> 类型：`string`
>
> 必填：是

功能编码，且必须唯一。用户进入插件应用时，uTools 会将该编码传入应用，用于区分不同功能并执行对应的逻辑。

### `feature.explain`

> 类型：`string`
>
> 必填：否

功能描述

### `feature.icon`

> 类型：`string`
>
> 必填：否

功能图标文件，支持 `.png`、`.jpg`、`.svg` 格式。指定为相对于 `plugin.json` 的 **相对路径**。（可选配置）

### `feature.mainPush`

> 类型：`boolean`
>
> 必填：否

是否向搜索框推送内容。（若无特殊需求，可不配置该字段）

### `feature.mainHide`

> 类型：`boolean`
>
> 必填：否

当配置为 `true` 时，触发该功能的指令将不会主动显示主搜索框。适用于需要直接执行功能的场景，例如：指令触发后立即创建独立窗口，或直接将输入/粘贴文本发送到系统窗口等。（若无特殊需求，可不配置该字段）

### `feature.cmds`

> 类型：`Array<string|object>`
>
> 必填：是
>
> 最小长度：`1`

配置该功能的指令集合，指令分「功能指令」和「匹配指令」

## 功能指令

功能指令用于在 uTools 搜索框直接搜索并打开插件应用功能。

**要求**:
- 功能指令名称必须**简短、明确、唯一**；禁止无意义、重复或模糊名称。
- 中文指令无需额外配置拼音或首字母，uTools 会自动支持拼音和首字母搜索。

示例：
::: code-group

```json [plugin.json]
{
  "features": [
    {
      "code": "foo",
      "cmds": ["测试"]
    }
  ]
}
```

:::

## 匹配指令

在 uTools 搜索框输入特定文本或粘贴图片、文件（或文件夹）时，匹配出可处理该内容的指令。

### `regex`

正则匹配特定文本

::: code-group

```json [plugin.json]
{
  "features": [
    {
      "code": "regex",
      "cmds": [
        {
          // 类型标记（必须）
          "type": "regex",
          // 指令名称（必须）
          "label": "打开网址",
          // 正则表达式字符串
          // 注意: 正则表达式存如果在斜杠 "\" 需要多加一个，"\\"
          // 注意：“任意匹配的正则” 会被 uTools 忽视，例如：/.*/ 、/(.)+/、/[\s\S]*/ ...
          "match": "/^https?:\\/\\/[^\\s/$.?#]\\S+$|^[a-z0-9][-a-z0-9]{0,62}(\\.[a-z0-9][-a-z0-9]{0,62}){1,10}(:[0-9]{1,5})?$/i",
          // 最少字符数 (可选)
          "minLength": 1,
          // 最多字符数 (可选)
          "maxLength": 1000
        }
      ]
    }
  ]
}
```

:::

### `over`

匹配任意文本

::: code-group

```json [plugin.json]
{
  "features": [
    {
      "code": "over",
      "cmds": [
        {
          // 类型标记（必须）
          "type": "over",
          // 指令名称（必须）
          "label": "百度一下",
          // 排除的正则表达式字符串 (任意文本中排除的部分) (可选)
          "exclude": "/\\n/",
          // 最少字符数 (可选)
          "minLength": 1,
          // 最多字符数 (默认最多为 10000) (可选)
          "maxLength": 500
        }
      ]
    }
  ]
}
```

:::

### `img`

匹配图像

::: code-group

```json [plugin.json]
{
  "features": [
    {
      "code": "img",
      "cmds": [
        {
          // 类型标记（必须）
          "type": "img",
          // 指令名称（必须）
          "label": "图像保存为文件"
        }
      ]
    }
  ]
}
```

:::

### `files`

匹配文件(夹)

::: code-group

```json [plugin.json]
{
  "features": [
    {
      "code": "files",
      "cmds": [
        {
          // 类型标记（必须）
          "type": "files",
          // 指令名称（必须）
          "label": "图片批量处理",
          // 文件类型 - "file"、"directory" (可选)
          "fileType": "file",
          // 文件扩展名 (可选)
          "extensions": ["png", "jpg", "jpeg", "svg", "webp", "tiff", "avif", "heic", "bmp", "gif"],
          // 匹配文件(夹)名称的正则表达式字符串，与 extensions 二选一 (可选)
          "match": "/\\.(?:jpg|jpeg|png|svg|webp|tiff|avif|heic|bmp)$/i",
          // 最少文件数 (可选)
          "minLength": 1,
          // 最多文件数 (可选)
          "maxLength": 100
        }
      ]
    }
  ]
}
```

:::

### `window`

匹配当前活动的系统窗口

::: code-group

```json [plugin.json]
{
  "features": [
    {
      "code": "window",
      "cmds": [
        {
          // 类型标记（必须）
          "type": "window",
          // 指令名称（必须）
          "label": "窗口置顶",
          // 窗口匹配规则
          "match": {
            // 应用名称（必须）
            "app": ["xxx.app", "xxx.exe"],
            // 匹配窗口标题的正则表达式字符串 (可选)
            "title": "/xxx/",
            // 窗口类 (Windows 专有) (可选)
            "class": ["xxx"]
          }
        }
      ]
    }
  ]
}
```

:::


::: warning
正则表达式存如果在斜杠 "\" 需要多加一个，"\\"
:::

## 插件应用为 AI Agent 提供能力

通过配置 `tools`，可以将插件应用能力以标准化工具的形式暴露给 AI Agent（如 OpenClaw、Claude Code 等），使其在执行过程中能够自主决策并调用相应能力完成任务。

> ⚠️**重要约束**
>
> 配置 `tools` 后，必须在运行时代码中通过 `utools.registerTool` 完成注册，否则 AI Agent 无法实际调用该工具。
> ```js
> utools.registerTool('say_hi', async () => { return 'hi' })
> ```

### `tools`

> 类型：`object`
>
> 必填：否

用于向 AI Agent 暴露可调用的工具集合，每个工具以键值对形式定义。
键名必须为小写 `snake_case`，用于唯一标识工具，示例：`say_hi`、`video_convert`。

### 工具对象字段

- **description** (`string`)：工具功能说明，便于 AI 理解和调用。  
- **inputSchema** (`object`)：JSON Schema 定义工具输入参数结构，遵循 JSON Schema 使用指南。必须为有效对象，不能为 `null`。  
  无参数工具推荐使用 `{ "type": "object", "additionalProperties": false }`（仅允许空对象）或 `{ "type": "object" }`（允许任意对象）。  
- **outputSchema** (`object`, 可选)：JSON Schema 定义工具输出结果结构，遵循 JSON Schema 使用指南。

### `tools` 配置示例

```json
"tools" : {
  "say_hi": {
    "description": "向用户打个招呼",
    "inputSchema": { "type": "object", "additionalProperties": false }
  },
  "video_convert": {
    "description": "视频格式转换",
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "inputPath": {
          "type": "string",
          "description": "输入视频文件绝对路径"
        },
        "format": {
          "type": "string",
          "enum": ["mp4", "mkv", "mov", "webm", "avi", "flv", "wmv"],
          "description": "目标视频格式"
        }
      },
      "required": ["inputPath", "format"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "outputPath": {
          "type": "string",
          "description": "输出视频文件绝对路径"
        }
      },
      "required": ["outputPath"]
    }
  }
}
```

### AI Agent 专用（无 UI 模式）

当插件应用仅给 AI Agent 使用，可采用最小配置模式：

- 无需配置：`main`、`features`（不提供界面能力）
- 必需配置：`logo`、`preload`、`tools`

## plugin.json 配置完整示例

```json
 {
  "main": "index.html",
  "logo": "logo.png",
  "preload": "preload.js",
  "features": [
    {
      "code": "test-text",
      "explain": "功能指令 —— 可搜索打开的指令示例",
      "cmds": ["功能指令"]
    },
    {
      "code": "test-regex",
      "explain": "匹配指令 —— 正则匹配示例",
      "cmds": [
        {
          "type": "regex",
          "label": "打开链接",
          "match": "/^(?:(http|https|ftp):\/\/)?((?:[\\w-]+\\.)+[a-z0-9]+)((?:\/[^\/?#]*)+)?(\\?[^#]+)?(#.+)?$/i",
          "minLength": 7,
          "maxLength": 2000
        },
        {
          "type": "regex",
          "label": "身份证号查询",
          "match": "/^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}(\\d|X)$/",
          "minLength": 18,
          "maxLength": 18
        },
        {
          "type": "regex",
          "label": "手机号查询",
          "match": "/^1[3456789]\\d{9}$/",
          "minLength": 11,
          "maxLength": 11
        },
        {
          "type": "regex",
          "label": "手机号查询",
          "match": "/^1[3456789]\\d{9}$/",
          "minLength": 11,
          "maxLength": 11
        },
        {
          "type": "regex",
          "match": "/^\\(*[+-]?(?:\\d{1,15}|\\d{1,3}(?:,\\d\\d\\d){1,4})(?:\\.\\d{1,15})?%?\\)*(?:\\s*[+*/^%-]\\s*\\(*[+-]?(?:\\d{1,15}|\\d{1,3}(?:,\\d\\d\\d){1,4})(?:\\.\\d{1,15})?%?\\)*)+$/",
          "label": "公式计算",
          "maxLength": 1000
        }
      ]
    },
    {
      "code": "test-files",
      "explain": "匹配指令 —— 文件(夹)匹配示例",
      "cmds": [
        {
          "type": "files",
          "label": "任意文件重命名"
        },
        {
          "type": "files",
          "fileType": "file",
          "extensions": ["png", "jpg", "jpeg", "svg", "webp", "tiff", "avif", "heic", "bmp", "gif"],
          "label": "图片批量处理"
        },
        {
          "type": "files",
          "fileType": "directory",
          "label": "读取文件夹内所有文件",
          "maxLength": 1
        },
        {
          "type": "files",
          "fileType": "file",
          "extensions": ["pdf", "md", "doc", "docx", "xls", "xlsx", "txt"],
          "label": "AI 文档处理",
          "maxLength": 50
        },
        {
          "type": "files",
          "fileType": "file",
          "extensions": ["mp4", "webm", "avi", "flv", "mkv", "mov", "wmv"],
          "label": "视频批量处理"
        }
      ]
    },
    {
      "code": "test-img",
      "explain": "匹配指令 —— 图像匹配示例",
      "cmds": [
        {
          "type": "img",
          "label": "OCR 文字识别"
        },
        {
          "type": "img",
          "label": "保存为图片文件"
        }
      ]
    },
    {
      "code": "test-over",
      "explain": "匹配指令 —— 任意文本匹配示例",
      "cmds": [
        {
          "type": "over",
          "label": "问问 AI"
        },
        {
          "type": "over",
          "label": "Google 搜索",
          "exclude": "/\\n/",
          "minLength": 1,
          "maxLength": 500
        }
      ]
    },
    {
      "code": "test-window",
      "explain": "匹配指令 —— 当前活动应用窗口匹配示例",
      "cmds": [
        {
          "type": "window",
          "match": {
            "app": ["explorer.exe", "SearchApp.exe", "SearchHost.exe", "FESearchHost.exe", "prevhost.exe"],
            "class": ["CabinetWClass", "ExploreWClass"]
          },
          "label": "终端中打开当前目录"
        },
        {
          "type": "window",
          "match": {
            "app": ["chrome.exe", "firefox.exe", "msedge.exe", "Safari.app", "Google Chrome.app", "Microsoft Edge.app"],
            "title": "/^(?:GitHub - )?[A-Za-z0-9][A-Za-z0-9-]+\\//"
          },
          "label": "Github Clone"
        }
      ]
    }
  ]
}

```

# 认识 `preload`

当你在 `plugin.json` 文件配置了 `preload` 字段，指定的 js 文件将被预加载，该 js 文件可以调用 Node.js API 的本地原生能力和 Electron 渲染进程 API。

## 为什么需要 `preload`

在传统的 web 开发中，为了保持用户运行环境的安全，JavaScript 被做了很强的沙箱限制，比如不能访问本地文件，不能访问跨域网络资源，不能访问本地存储等。

uTools 基于 Electron 构建，通过 preload 机制，在渲染线程中，释放了沙箱限制，使得用户可以通过调用 Node.js 的 API 来访问本地文件、跨域网络资源、本地存储等。

## `preload` 的定义

`preload` 是完全独立于前端项目的一个特殊文件，它应当与 `plugin.json` 位于同一目录或其子目录下，保证可以在打包插件应用时可以被一起打包。

`preload` js 文件遵循 `CommonJS` 规范，因此你可以使用 `require` 来引入 Node.js 模块，此部分可以参考 [Node.js 文档](https://nodejs.org/api/modules.html)。


## 前端使用 `preload`

只需给 `window` 对象自定义一个属性，前端就可直接访问该属性。

::: code-group

```js [preload.js]
const fs = require("fs");

window.customApis = {
  readFile: (path) => {
    return fs.readFileSync(path, "utf8");
  },
};
```

```jsx [App.jsx] {5-7}
import { useEffect, useState } from "react";
export default function App() {
  const [file, setFile] = useState("");
  useEffect(() => {
    window.customApis.readFile("/path/to/README.md").then((data) => {
      setFile(data);
    }
  }, []);

  return (
    <div>
      <pre>{file}</pre>
    <div>
  )
}
```

:::

## `preload` js 规范

由于 `preload` js 文件可使用本地原生能力，为了防止开发者滥用各种读写文件、网络等能力，uTools 规定：

- `preload` js 文件代码不能进行打包/压缩/混淆等操作，要保证每一行代码清晰可读。
- 引入的第三方模块也必须清晰可读，在提交时将源码一同提交，同样不允许压缩/混淆。



# 使用 Node.js

`preload` js 文件遵循 `CommonJS` 规范，通过 `require` 引入 Node.js (16.x 版本) 模块

可以引入 Node.js 所有原生模块，开发者自己编写的 Node.js 模块以及第三方 Node.js 模块。

## 引入 Node.js 原生模块

::: code-group

```js [preload.js]
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execSync } = require("node:child_process");

window.services = {
  readFile: (filename) => {
    return fs.readFileSync(filename, { encoding: "utf-8" });
  },
  getFolder: (filepath) => {
    return path.dirname(filepath);
  },
  getOSInfo: () => {
    return { arch: os.arch(), cpus: os.cpus(), release: os.release() };
  },
  execCommand: (command) => {
    execSync(command);
  },
};
```

:::

## 引入自己编写的模块

::: code-group

```js [preload.js]
const writeText = require("./libs/writeText.js");

window.services = {
  writeText,
};
```

```js [libs/writeText.js]
const fs = require("fs");
const path = require("path");

module.exports = function writeText(text, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, text);
    return true;
  }
  return false;
};
```

:::

## 引入第三方模块

### 通过 `npm` 安装

在 `preload.js` 同级目录下，保证存在一个独立的 `package.json`，并且设置 `type` 为 `commons`。

```json [package.json]
{
  "type": "commonjs"
  "dependencies": {}
}
```

在 `preload.js` 同级目录下，执行 `npm install` 安装第三方模块，保证 `node_modules` 目录存在。

以下是通过 `npm` 引入 `colord` 的示例:

```bash
npm install colord
```

::: code-group

```js [preload.js] {1,6,10}
const { getFormat, colord } = require("colord");

window.services = {
  colord: {
    darken(text) {
      const fmt = getFormat(text);
      if (!fmt) {
        return [null, "请输入一个有效的颜色值，比如 #000 或 rgb(0,0,0)"];
      } else {
        const darkColor = colord(text).darken(0.1);
        return [darkColor, null];
      }
    },
  },
};
```

:::

### 通过源码引入

在 `preload.js` 同级目录下，下载源码，并使用 `require` 引入。

比如从 `github` 下载 `nodemailer`：

```bash
git clone https://github.com/nodemailer/nodemailer.git
```

::: code-group

```js [preload.js] {1,6-30}
const nodemailer = require("./nodemailer");
const _setImmediate = setImmediate;
process.once("loaded", function () {
  global.setImmediate = _setImmediate;
});
const sendMail = () => {
  let transporter = require("./nodemailer").createTransport({
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: {
      user: "aaa@qq.com",
      pass: "xxx",
    },
  });
  let mailOptions = {
    from: "aaa@qq.com",
    to: "bbb@gmail.com",
    subject: "Sending Email using Node.js",
    text: "That was easy!",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
window.services = {
  sendMail: () => {
    return sendMail();
  },
};
```

:::

## 引入 Electron 渲染进程 API

::: code-group

```js [preload.js]
const { clipboard, nativeImage } = require("electron");

window.services = {
  copyImage: (imageFilePath) => {
    clipboard.writeImage(nativeImage.createFromPath(imageFilePath))
  },
};
```
:::


# 事件

你可以根据需要，事先传递一些回调函数给这些事件，uTools 会在对应事件被触发时调用它们。

## `utools.onPluginEnter(callback)`

进入插件应用时，uTools 将会主动调用这个方法。

### 类型定义

```ts
function onPluginEnter(callback: (action: PluginEnterAction) => void): void;
```

- `callback` 进入插件应用触发的回调函数

::: details `PluginEnterAction` 类型定义 {#plugin-enter-action}

```ts
interface PluginEnterAction {
  code: string;
  type: "text" | "img" | "file" | "regex" | "over" | "window";
  payload: string | MatchFile[] | MatchWindow;
  from: "main" | "panel" | "hotkey" | "reirect";
  option?: {
    mainPush: boolean;
  };
}
```

#### 字段说明

- `code`
  - plugin.json 配置的 feature.code
- `type`
  - plugin.json 配置的 feature.cmd.type
- `payload`
  - feature.cmd.type 对应匹配的数据
- `option`
  - feature.mainPush 设置为 ture ，且当用户选择 onMainPush 返回的选项进入时
- `from`
  - 根据不同触发来源提供：
  >
  - `main`: 主面板
  - `panel`: 超级面板
  - `hotkey`: 快捷键
  - `reirect`: 重定向

:::

::: details `MatchFile` 类型定义

```ts
interface MatchFile {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  path: string;
}
```

:::

::: details `MatchWindow` 类型定义

```ts
interface MatchWindow {
  id: number;
  class: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  appPath: string;
  pid: number;
  app: string;
}
```

:::

### 示例代码

```js
utools.onPluginEnter(({ code, type, payload, option, from }) => {
  console.log("用户进入插件应用", code, type, payload);
  console.log("用户inrush插件的方式：", from);
});
```

## `utools.onPluginOut(callback)`

插件应用退出时触发

### 类型定义

```ts
function onPluginOut(callback: (isKill: boolean) => void): void;
```

- `callback` 退出插件应用时触发的回调函数
  - `isKill` 为 `true` 时，表示插件应用结束运行(进程结束)

### 示例代码

```js
utools.onPluginOut((isKill) => {
  if (isKill) {
    console.log("用户结束运行插件应用");
  } else {
    console.log("插件应用被隐藏后台");
  }
});
```

## `utools.onMainPush(callback, onSelect)`

推送内容到搜索框，并设置从推送的内容选项中打开插件应用的回调

::: warning 注意
向搜索框推送消息(需要设置 feature.mainPush 设置为 true)，详情请参考 [plugin.json#feature.mainPush](../../information/plugin-json.md#features-mainpush)
:::

### 类型定义

```ts
function onMainPush(
  callback: (action: MainPushAction) => MainPushResult[],
  onSelect: (action: PluginEnterAction) => boolean | undefined
): void;
```
- `callback` 触发向搜索框推送内容
  - MainPushAction 触发的参数
  >
  - MainPushResult 返回的内容
- `onSelect` 用户选择推送的内容时触发，返回 `true` 表示进入插件应用并显示，不返回则静默执行该函数
  - PluginEnterAction 参考 [`onPluginEnter#PluginEnterAction`](#plugin-enter-action)

::: details `MainPushAction` 类型定义

```ts
interface MainPushAction {
  code: string;
  type: "text" | "img" | "file" | "regex" | "over" | "window";
  payload: string | MatchFile[] | MatchWindow;
}
```

#### 字段说明

- `code`
  - plugin.json 配置的 feature.code
- `type`
  - plugin.json 配置的 feature.cmd.type
- `payload`
  - feature.cmd.type 对应匹配的数据，`MatchFile` 和 `MatchWindow` 类型参考 [onPluginEnter](#utools-onpluginenter)

:::

::: details `MainPushResult` 类型定义

```ts
interface MainPushResult {
  icon: string;
  title: string;
  text: string;
}
```

#### 字段说明

- `icon`
  - 推送消息的图标
- `title`
  - 推送消息的标题
- `text`
  - 推送消息的内容

:::

### 示例代码

```js
function callback({ code, type, payload }) {
  return [
    {
      icon: "icon.png",
      text: "选项1",
      title: "help text",
    },
    {
      text: "选项2",
      anyField: "xxxx",
    },
  ];
}
function selectCallback({ code, type, payload, option }) {
  if (option.xxx) {
    // 返回 true 表示需要进入插件应用处理
    return true;
  }
  // 不进入插件应用 "执行粘贴文本"
  utools.hideMainWindowPasteText(option.text);
}
utools.onMainPush(callback, selectCallback);
```

## `utools.onPluginDetach(callback)`

用户对插件应用进行分离操作时触发

### 类型定义

```ts
function onPluginDetach(callback: () => void): void;
```

- `callback` 插件应用分离为独立窗口时触发的回调函数

### 示例代码

```js
utools.onPluginDetach(() => {
  console.log("插件应用分离为独立窗口");
});
```

## `utools.onDbPull(callback)`

当此插件应用的数据在其他设备上被更改后同步到此设备时触发

### 类型定义

```ts
function onDbPull(callback: (docs: DbDoc[]) => void): void;
```

- `callback` 当插件应用在运行中，从云端同步该插件应用数据时触发的回调函数
  - `docs` 同步的数据，类型参考 [DbDoc](../db/local-db.md#def-dbdoc)

### 示例代码

```js
utools.onDbPull((docs) => {
  console.log(docs);
});
```


# 窗口

用来实现一些跟 uTools 窗口相关的功能

## `utools.hideMainWindow(isRestorePreWindow)`

执行该方法将会隐藏 uTools 主窗口，包括此时正在主窗口运行的插件应用，分离的插件应用不会被隐藏。

### 类型定义

```ts
function hideMainWindow(isRestorePreWindow?: boolean): boolean;
```

- `isRestorePreWindow`表示是否焦点回归到前面的活动窗口，默认 true

### 示例代码

```js
utools.hideMainWindow();
```

## `utools.showMainWindow()`

执行该方法将会显示 uTools 主窗口，包括此时正在主窗口运行的插件应用。

### 类型定义

```ts
function showMainWindow(): boolean;
```

### 示例代码

```js
utools.showMainWindow();
```

## `utools.setExpendHeight(height)`

设置插件应用在主窗口中的高度，单位为像素。

### 类型定义

```ts
function setExpendHeight(height: number): boolean;
```

- `height` 插件应用高度

### 示例代码

```js
utools.setExpendHeight(300);
```

## `utools.setSubInput(onChange[, placeholder[, isFocus]])`

设置子输入框，进入插件应用后，原本 uTools 的搜索条主输入框将会变成子输入框，子输入框可以为插件应用所使用。

### 类型定义

```ts
function setSubInput(onChange: (details: { text: string }) => void, placeholder?: string, isFocus?: boolean): boolean;
```

- `onChange`: 输入框内容变化时的回调函数
- `placeholder`: 输入框占位符
- `isFocus`: 是否自动聚焦，默认为 `true`

### 示例代码

```js
utools.setSubInput(({ text }) => {
  console.log(text);
}, "搜索");
```

#### 效果截图

![设置子输入框](https://res.u-tools.cn/website/subInput.png "设置子输入框")

## `utools.removeSubInput()`

移除子输入框。

### 类型定义

```ts
function removeSubInput(): boolean;
```

### 示例代码

```js
utools.removeSubInput();
```

## `utools.setSubInputValue(text)`

直接对子输入框的值进行设置。

### 类型定义

```ts
function setSubInputValue(text: string): boolean;
```

- `text` 子输入框赋值的文本

### 示例代码

```js
utools.setSubInputValue("hello world");
```

## `utools.subInputFocus()`

聚焦子输入框。

### 类型定义

```ts
function subInputFocus(): boolean;
```

### 示例代码

```js
utools.subInputFocus();
```

## `utools.subInputBlur()`

子输入框失去焦点，插件应用获得焦点

### 类型定义

```ts
function subInputBlur(): boolean;
```

### 示例代码

```js
utools.subInputBlur();
```

## `utools.subInputSelect()`

子输入框获得焦点并选中子输入框的内容

### 类型定义

```ts
function subInputSelect(): boolean;
```

### 示例代码

```js
utools.subInputSelect();
```

## `utools.outPlugin([isKill])`

退出插件应用，默认将插件应用隐藏后台。

### 类型定义

```ts
function outPlugin(isKill?: boolean): boolean;
```

- `isKill` 为 `true` 时，将结束运行插件应用(杀死进程)

### 示例代码

```js
utools.outPlugin();
```

## `utools.redirect(label[, payload])`

跳转到另一个插件应用，并可以携带匹配指令的内容，如果插件应用不存在，则跳转到插件应用市场进行下载。

### 类型定义

```ts
function redirect(label: string | [string, string], payload?: any): boolean;
```

- `label` 为 `string` 时参数为指令名称。若传递数组，则第一个元素为插件应用名称，第二个元素为指令名称
  > - 只传递指令名称，底座会查找所有拥有该指令的插件应用，如果只查找到一个插件应用则直接打开，多个则让用户选择打开，未找到将跳转至插件应用市场并搜索该指令名称
  > - 传递数组，即包含插件应用名称和指令名称，底座将定位到该插件应用并打开对应指令，若插件应用未下载，将跳转至插件应用市场下载再打开。
- `payload` 跳转「功能指令」该参数设为空。若跳转「匹配指令」则该参数必须为指令可匹配的内容

### 示例代码

```js
// 跳转到插件应用「聚合翻译」并翻译内容
utools.redirect(["聚合翻译", "翻译"], "hello world");

// 找到 “翻译” 指令，并自动跳转到对应插件应用
utools.redirect("翻译", "hello world");

// 跳转到插件应用「OCR 文字识别」并识别图片中文字
utools.redirect(["OCR 文字识别", "OCR 文字识别"], {
  type: "img",
  data: "data:image/png;base64,", // base64
});

// 跳转到插件应用「JSON 编辑器」查看 Json 文件
utools.redirect(["JSON 编辑器", "Json"], {
  type: "files",
  data: "/path/to/test.json", // 支持数组
});
```

## `utools.showOpenDialog(options)`

弹出文件选择框

### 类型定义

```ts
function showOpenDialog(options: OpenDialogOptions): string[] | undefined;
```

- `OpenDialogOptions` 与[Electron `showOpenDialogSync#options`](https://www.electronjs.org/docs/api/dialog#dialogshowopendialogsyncbrowserwindow-options) 一致
- 返回文件路径数组。用户取消则返回空

### 示例代码

```js
const files = utools.showOpenDialog({
  filters: [{ name: "plugin.json", extensions: ["json"] }],
  properties: ["openFile"],
});

console.log(files);
```

## `utools.showSaveDialog(options)`

弹出文件保存框

### 类型定义

```ts
function showSaveDialog(options: SaveDialogOptions): string | undefined;
```

- `SaveDialogOptions` 与[Electron `showSaveDialogSync#options`](https://www.electronjs.org/docs/api/dialog#dialogshowsavedialogsyncbrowserwindow-options) 一致
- 返回选择的文件夹路径。用户取消则返回空

### 示例代码

```js
const savePath = utools.showSaveDialog({
  title: "保存位置",
  defaultPath: utools.getPath("downloads"),
  buttonLabel: "保存",
});
console.log(savePath);
```

## `utools.findInPage(text[, options])`

在当前页面中查找文本

### 类型定义

```ts
function findInPage(text: string, options?: FindInPageOptions): void;
```

- `text` 查找的文本
- `FindInPageOptions` 与[Electron `webContents.findInPage#options`](https://www.electronjs.org/docs/api/web-contents#contentsfindinpagetext-options) 一致

### 示例代码

```js
utools.findInPage("hello world");
```

## `utools.stopFindInPage(action)`

停止查找，与`findInPage` 配合使用

### 类型定义

```ts
function stopFindInPage(
  action: "clearSelection" | "keepSelection" | "activateSelection"
): void;
```

- `action`: `clearSelection` 清除选中文本，`keepSelection` 保留选中文本，`activateSelection` 激活选中文本，默认值为 `clearSelection`

### 示例代码

```js
utools.stopFindInPage("clearSelection");
```

## `utools.startDrag(filePath)`

从插件中拖拽文件到其他窗口，拖拽产生一系列原生文件

### 类型定义

```ts
function startDrag(filePath: string | string[]): void;
```

- `filePath` 是文件路径，也可以是文件路径数组

### 示例代码

```js
utools.startDrag("/path/to/abc.txt");
utools.startDrag(["/path/to/1.txt", "/path/to/2.txt"]);
```

## `utools.createBrowserWindow(url[, options][, callback])`

创建一个独立窗口

### 类型定义

```ts
function createBrowserWindow(url: string, options: BrowserWindowConstructorOptions, callback?: Function): BrowserWindow;
```

- `url` 相对路径的 html 文件
- `options` 参数参考 Electron 的 [BrowserWindowConstructorOptions](https://electronjs.org/docs/api/browser-window#new-browserwindowoptions)。**注意：preload 配置也是相对路径**。
- `callback` 在页面加载完成后调用
- 返回的 `BrowserWindow` 由 uTools 定制，大部分的函数和属性都是继承 Electron 的 [BrowserWindow](https://electronjs.org/docs/api/browser-window)。**注意：不包含 BrowserWindow 和 webContents 的实例事件**。

### 示例代码

::: code-group

```js [父窗口]
const ubWindow = utools.createBrowserWindow(
  "test.html",
  {
    show: false,
    title: "测试窗口",
    webPreferences: {
      preload: "preload.js",
    },
  },
  () => {
    // 显示
    ubWindow.show();
    // 置顶
    ubWindow.setAlwaysOnTop(true);
    // 窗口全屏
    ubWindow.setFullScreen(true);
    // 向子窗口发送消息
    ubWindow.webContents.send("ping", "test");
    // 执行脚本
    ubWindow.webContents.executeJavaScript('fetch("https://jsonplaceholder.typicode.com/users/1").then(resp => resp.json())').then((result) => {
      console.log(result); // Will be the JSON object from the fetch call
    });
  }
);
console.log(ubWindow);
```

```js [子窗口]
// 在新建窗口的 preload.js 中接收父窗口传递过来的数据
const { ipcRenderer } = require("electron");
ipcRenderer.on("ping", (event, data) => {
  console.log(data);
});
utools.sendToParent("pong", "hello world"); // 版本：>= 6.1.0
```

:::

## `utools.sendToParent(channel[, ...args])`

发送消息到父窗口

### 类型定义

```ts
function sendToParent(channel: string, ...args: any[]): void; // 版本：>=6.1.0
```

- `channel` 消息通道名称

### 示例代码

```js
// 通过 utools.createBrowserWindow 创建的窗口调用
utools.sendToParent("pong", "hello", 123); // 版本：>= 6.1.0
```

## `utools.getWindowType()`

获取当前窗口类型, 'main' 主窗口、'detach' 分离窗口、'browser' 由 `createBrowserWindow` 创建的窗口

### 类型定义

```ts
function getWindowType(): "main" | "detach" | "browser";
```

### 示例代码

```js
utools.onPluginEnter(({ code, type, payload }) => {
  if (utools.getWindowType() === "main") {
    utools.showNotification("当前窗口为主窗口");
  }
});
```

## `utools.isDarkColors()`

获取是否深色主题

### 类型定义

```ts
function isDarkColors(): boolean;
```

### 示例代码

```js
utools.onPluginEnter(({ code, type, payload }) => {
  document.body.className = utools.isDarkColors() ? "dark-mode" : "";
});
```

::: warning 推荐

更推荐 web 原生方式判断
```js
  let theme
  // 是否深色主题
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  theme = isDark ? 'dark' : 'light'
  // 监听主题切换
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    theme = e.matches ? 'dark' : 'light'
  })
```
:::


# 复制

执行复制文本、图像、文件(夹)

## `utools.copyText(text)`

复制文本

### 类型定义

```ts
function copyText(text: string): boolean;
```

- `text` 被复制的文本

### 示例代码

```js
utools.copyText("Hello World!");
```

## `utools.copyFile(filePath)`

复制文件

### 类型定义

```ts
function copyFile(filePath: string | string[]): boolean;
```

- `filePath` 为文件路径，可以是单个文件路径，也可以是文件路径数组。

### 示例代码

```js
utools.copyFile("C:\\Users\\Administrator\\Desktop\\test.txt");
```

## `utools.copyImage(image)`

复制图像

### 类型定义

```ts
function copyImage(image: string | Uint8Array): boolean;
```

- `image` 可以是一张图片文件路径，也可以是图像 Base64 的 Data URL。或图像的 Buffer

### 示例代码

```js
// base64
utools.copyImage("data:image/png;base64,......");
// 路径
utools.copyImage("/path/to/img.png");
```

## `utools.getCopyedFiles()`

获取系统剪贴板中复制的文件列表，返回一个数组，数组中的元素为文件路径。

### 类型定义

```ts
function getCopyedFiles(): CopiedFile[];
```

::: details `CopiedFile` 类型定义

```ts
interface CopiedFile {
  path: string;
  isDiractory: boolean;
  isFile: boolean;
  name: string;
}
```

#### 字段说明

- `path`
  - 文件路径
- `isDiractory`
  - 是否为文件夹
- `isFile`
  - 是否为文件
- `name`
  - 文件名

:::


# 输入

对外部应用进行一些输入操作，粘贴文本、粘贴图像、粘贴文件。

## `utools.hideMainWindowPasteFile(filePath)`

先复制文件再执行粘贴操作

### 类型定义

```ts
function hideMainWindowPasteFile(filePath: string | string[]): boolean;
```

- `filePath` 为文件路径，可以是单个文件路径，也可以是文件路径数组。

### 示例代码

```js
utools.hideMainWindowPasteFile("C:\\Users\\Administrator\\Desktop\\test.txt");
```

## `utools.hideMainWindowPasteImage(image)`

先复制图像再执行粘贴操作

### 类型定义

```ts
function hideMainWindowPasteImage(image: string | Uint8Array): boolean;
```

- `image` 可以是一张图片文件路径，也可以是图像 Base64 的 Data URL。或图像的 Buffer

### 示例代码

```js
// base64
utools.hideMainWindowPasteImage("data:image/png;base64,......");
// 路径
utools.hideMainWindowPasteImage("/path/to/test.png");
```

## `utools.hideMainWindowPasteText(text)`

先复制文本再执行粘贴操作

### 类型定义

```ts
function hideMainWindowPasteText(text: string): boolean;
```

- `text` 字符串文本

### 示例代码

```js
utools.hideMainWindowPasteText("Hello World!");
```

## `utools.hideMainWindowTypeString(text)`

输入文本，与输入法原理类似，可以输入任意字符串

### 类型定义

```ts
function hideMainWindowTypeString(text: string): boolean;
```

- `text` 要输入的文本，支持 Emoji

### 示例代码

```js
utools.hideMainWindowTypeString("uTools 新一代效率工具平台 - 🐼👏🦄👨‍👩‍👧‍👦🚵🏻");
```


# 系统

提供一些系统级 API 的封装，也包含部分对于 uTools 底座功能的封装。

## `utools.showNotification(body[, clickFeatureCode])`

弹出系统通知

### 类型定义

```ts
function showNotification(body: string, clickFeatureCode?: string): void;
```

- `body` 通知的内容
- `clickFeatureCode` 对应 plugin.json 配置的 feature.code，点击通知进入插件应用

### 示例代码

```js
utools.showNotification("hello test");
```

## `utools.shellOpenPath(fullPath)`

系统默认方式打开给定的文件

### 类型定义

```ts
function shellOpenPath(fullPath: string): void;
```

- `fullPath` 文件(夹)路径

### 示例代码

```js
utools.shellOpenPath("C:\\Users\\Public\\Desktop\\test.txt");
```

## `utools.shellTrashItem(fullPath)`

删除文件到回收站

### 类型定义

```ts
function shellTrashItem(fullPath: string): void;
```

- `fullPath` 文件路径

### 示例代码

```js
utools.shellTrashItem("C:\\Users\\Public\\Desktop\\test.txt");
```

## `utools.shellShowItemInFolder(fullPath)`

在文件管理器中显示文件

### 类型定义

```ts
function shellShowItemInFolder(fullPath: string): void;
```

- `fullPath` 文件(夹)路径

### 示例代码

```js
utools.shellShowItemInFolder("C:\\Users\\Public\\Desktop\\test.txt");
```

## `utools.shellOpenExternal(url)`

系统默认的协议打开 URL

### 类型定义

```ts
function shellOpenExternal(url: string): void;
```

- `url` 常规是 http 协议的 url, 也可以其他协议的 url, 例如：写邮件 mailto:example@example.com?subject=Hello&body=How%20are%20you%3F

### 示例代码

```js
// 打开 uTools 官网
utools.shellOpenExternal("https://www.u-tools.cn");
```

## `utools.shellBeep()`

播放系统提示音

### 类型定义

```ts
function shellBeep(): void;
```

### 示例代码

```js
utools.shellBeep();
```

## `utools.getNativeId()`

获取设备 ID，用于区别设备

### 类型定义

```ts
function getNativeId(): string;
```

### 示例代码

```js
// 存储只与当前设备相关的信息
const nativeId = utools.getNativeId();
utools.dbStorage.setItem(nativeId + "/key", "native value");
```

## `utools.getAppName()`

获取软件名称

### 类型定义

```ts
function getAppName(): string;
```

### 示例代码

```js
console.log(utools.getAppName());
```

## `utools.getAppVersion()`

获取软件版本

### 类型定义

```ts
function getAppVersion(): string;
```

### 示例代码

```js
console.log(utools.getAppVersion());
```

## `utools.getPath(name)`

获取路径，提供了一些特殊的路径获取方法

### 类型定义

```ts
function getPath(name: string): string;
```

- `name` 可以是以下特定的值
  - `home` 用户主目录
  - `appData` 应用程序数据目录
    - `%APPDATA%` (Windows)
    - `~/Library/Application Support` (macOS)
  - `userData` 应用程序用户数据目录，默认是 appData 文件夹附加应用的名称
  - `temp` 临时目录
  - `exe` 当前可执行文件的绝对路径
  - `desktop` 用户桌面目录
  - `documents` 用户文档目录
  - `downloads` 用户下载目录
  - `music` 用户音乐目录
  - `pictures` 用户图片目录
  - `videos` 用户视频目录
  - `logs` 用户日志目录


## `utools.getFileIcon(filePath)`

获取系统图标

### 类型定义

```ts
function getFileIcon(filePath: string): string;
```

- `filePath` 文件路径或文件扩展名
  - 文件夹用 'folder'
- 返回图标的 base64 Data Url

### 示例代码

```js
// txt 文件扩展类型的系统图标
const txtIcon = utools.getFileIcon(".txt");
// 文件夹系统图标
const folderIcon = utools.getFileIcon("folder");
// 微信图标
const folderIcon = utools.getFileIcon("C:\\Users\\Public\\Desktop\\微信.lnk");
```

## `utools.readCurrentFolderPath()`

读取当前文件管理器窗口路径 (linux 不支持)，前提当前活动系统窗口是「文件管理器」

### 类型定义

```ts
function readCurrentFolderPath(): Promise<string>;
```

### 示例代码

```js
const folderPath = await utools.readCurrentFolderPath();
console.log(folderPath);
```

## `utools.readCurrentBrowserUrl()`

读取当前浏览器窗口路径 (linux 不支持)，前提当前活动系统窗口是浏览器

::: warning 警告
由于浏览器差异，目前仅对以下浏览器完成测试：

- MacOS: Safari、Chrome、Microsoft Edge、Opera、Vivaldi、Brave
- Windows: Chrome、Firefox、Edge、IE、Opera、Brave

:::

### 类型定义

```ts
function readCurrentBrowserUrl(): Promise<string>;
```

### 示例代码

```js
const url = await utools.readCurrentBrowserUrl();
console.log(url);
```

## `utools.isDev()`

判断插件应用是否在开发环境

::: tip 提示
插件应用开发环境是指：插件应用项目在 uTools 开发者工具中接入开发打开的
:::

### 类型定义

```ts
function isDev(): boolean;
```

### 示例代码

```js
if (utools.isDev()) {
  console.log("插件应用开发环境");
}
```

## `utools.isMacOS()`

判断当前系统是否是 macOS

### 类型定义

```ts
function isMacOS(): boolean;
```

### 示例代码

```js
if (utools.isMacOS()) {
  console.log("当前系统是 macOS");
}
```

## `utools.isWindows()`

判断当前系统是否是 Windows

### 类型定义

```ts
function isWindows(): boolean;
```

### 示例代码

```js
if (utools.isWindows()) {
  console.log("当前系统是 Windows");
}
```

## `utools.isLinux()`

判断当前系统是否是 Linux

### 类型定义

```ts
function isLinux(): boolean;
```

### 示例代码

```js
if (utools.isLinux()) {
  console.log("当前系统是 Linux");
}
```


# 屏幕

提供一些针对用户屏幕的操作

## `utools.screenColorPick(callback)`

屏幕取色，弹出一个取色器，用户取完色执行回调函数

### 类型定义

```ts
function screenColorPick(callback: (colors: { hex: string; rgb: string }) => void): void;
```

- `callback`: 颜色选择后的回调函数
  - `colors`: 颜色对象
    - `hex`: 十六进制颜色值
    - `rgb`: RGB 颜色值

### 示例代码

```js
// 取色
utools.screenColorPick((colors) => {
  const { hex, rgb } = colors;
  console.log(hex, rgb);
});
```

## `utools.screenCapture(callback)`

屏幕截图，会进入截图模式，用户截图完执行回调函数

### 类型定义

```ts
function screenCapture(callback: (image: string) => void): void;
```
- `callback`: 截图完的回调函数
  - `image` 截图的图像 base64 Data Url

### 示例代码

```js
// 截图完将图片发送到「OCR 文字识别」再跳转到进行翻译
utools.screenCapture((image) => {
  utools.redirect(['OCR 文字识别', '文字识别+翻译'], image)
});
```

## `utools.getPrimaryDisplay()`

获取主显示器

### 类型定义

```ts
function getPrimaryDisplay(): Display;
```

::: tip 提示
在下列获取屏幕对象时，`Display` 类型定义见 [Display](https://www.electronjs.org/docs/api/screen#screengetprimarydisplay)
:::

### 示例代码

```js
const display = utools.getPrimaryDisplay();
console.log(display);
```

## `utools.getAllDisplays()`

获取所有显示器

### 类型定义

```ts
function getAllDisplays(): Display[];
```

### 示例代码

```js
const displays = utools.getAllDisplays();
console.log(displays);
```

## `utools.getCursorScreenPoint()`

获取鼠标当前位置，为鼠标在系统中的绝对位置

### 类型定义

```ts
function getCursorScreenPoint(): { x: number; y: number };
```

### 示例代码

```js
const { x, y } = utools.getCursorScreenPoint();
console.log(x, y);
```

## `utools.getDisplayNearestPoint(point)`

获取点位置所在的显示器

### 类型定义

```ts
function getDisplayNearestPoint(point: { x: number; y: number }): Display;
```

- `point` 包含 x 和 y 的位置对象

### 示例代码

```js
const display = utools.getDisplayNearestPoint({ x: 100, y: 100 });
console.log(display);
```

## `utools.getDisplayMatching(rect)`

获取矩形所在的显示器

### 类型定义

```ts
function getDisplayMatching(rect: { x: number; y: number; width: number; height: number; }): Display;
```

- `rect` 矩形对象

### 示例代码

```js
const display = utools.getDisplayMatching({
  x: 100,
  y: 100,
  width: 200,
  height: 200,
});
console.log(display);
```

## `utools.screenToDipPoint(point)`

屏幕物理坐标转 DIP 坐标

### 类型定义

```ts
function screenToDipPoint(point: { x: number; y: number }): { x: number; y: number; };
```

- `point` 包含 x 和 y 的位置对象

### 示例代码

```js
const dipPoint = utools.screenToDipPoint({ x: 200, y: 200 });
console.log(dipPoint);
```

## `utools.dipToScreenPoint(point)`

屏幕 DIP 坐标转物理坐标

### 类型定义

```ts
function dipToScreenPoint(point: { x: number; y: number }): { x: number; y: number;};
```

- `point` 包含 x 和 y 的位置对象

### 示例代码

```js
const screenPoint = utools.dipToScreenPoint({ x: 200, y: 200 });
console.log(screenPoint);
```

## `utools.screenToDipRect(rect)`

屏幕物理区域转 DIP 区域

### 类型定义

```ts
function screenToDipRect(rect: { x: number; y: number; width: number; height: number; }): { x: number; y: number; width: number; height: number; };
```

- `rect` 矩形对象

### 示例代码

```js
const dipRect = utools.screenToDipRect({ x: 0, y: 0, width: 200, height: 200 });
console.log(dipRect);
```

## `utools.dipToScreenRect(rect)`

DIP 区域转屏幕物理区域

### 类型定义

```ts
function dipToScreenRect(rect: { x: number; y: number; width: number; height: number; }): { x: number; y: number; width: number; height: number; };
```

- `rect` 矩形对象

### 示例代码

```js
const rect = utools.dipToScreenRect({ x: 0, y: 0, width: 200, height: 200 });
console.log(rect);
```

## `utools.desktopCaptureSources(options)`

获取桌面录屏源

### 类型定义

```ts
function desktopCaptureSources(options: DesktopCaptureSourcesOptions): Promise<DesktopCaptureSource[]>;
```

- `options` 用法请参考[utools.desktopCaptureSources](https://docs.autocode.com/utools/api/desktopCaptureSources.html)

### 示例代码

```js
(async () => {
  const ousrces = await utools.desktopCaptureSources({
    types: ["window", "screen"],
  });
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: ousrces[0].id,
        minWidth: 1280,
        maxWidth: 1280,
        minHeight: 720,
        maxHeight: 720,
      },
    },
  });
  const video = document.querySelector("video");
  video.srcObject = stream;
  video.onloadedmetadata = (e) => video.play();
})();
```


# 用户

通过用户接口，可以获取到用户的基本信息、临时 token 等。

## `utools.getUser()`

获取当前登录的用户信息，包括头像、昵称等。

### 类型定义

```ts
function getUser(): UserInfo | null;
```

- `getUser` 登录时返回用户信息，未登录时返回 `null`

::: details `UserInfo` 类型定义

```ts
interface UserInfo {
  avatar: string;
  nickname: string;
  type: "member" | "user";
}
```

#### 字段说明

- `avatar`
  - 用户头像
- `nickname`
  - 用户昵称
- `type`
  - 用户类型，member: 会员用户, user: 普通用户

:::

### 示例代码

```js
const user = utools.getUser();
if (user) {
  console.log(user);
}
```

## `utools.fetchUserServerTemporaryToken()`

获取用户服务端临时令牌。

### 类型定义

```ts
function fetchUserServerTemporaryToken(): Promise<TempToken>;
```

::: details `TempToken` 类型定义

```ts
interface TempToken {
  token: string;
  expired_at: number;
}
```

#### 字段说明

- `token`
  - 临时令牌
- `expired_at`
  - 令牌过期时间戳

:::

### 示例代码

```js
const { token, expire_at } = await utools.fetchUserServerTemporaryToken();
console.log(token);
console.log(expire_at);
```


# 动态指令

很多时候，插件应用中会提供一些功能供用户进行个性化设置（例如：网页快开插件应用），这部分配置无法在 `plugin.json` 事先定义好，所以我们提供了以下方法对插件应用功能进行动态增减。

## `utools.getFeatures([codes])`

获取插件应用动态创建的功能。

### 类型定义

```ts
function getFeatures(codes?: string[]): Feature[];
```

- `codes` 要获取的功能编码集合

::: details `Feature` 类型定义 {#def-feature}

```ts
interface Feature {
  code: string;
  explain?: string;
  icon?: string;
  platform?: string | string[];
  mainHide?: boolean;
  mainPush?: boolean;
  cmds: Cmd[];
}
```

#### 字段说明

- `code`
  - 功能编码，进入插件应用会将该编码带入，根据不同编码实现功能区分执行。（可参考 plugin.json 中 feature.code）
- `explain`
  - 功能描述（可参考 plugin.json 中 feature.explain）
- `icon`
  - 功能图标（可参考 plugin.json 中 feature.icon）
- `platform`
  - 指定功能可用平台（可参考 plugin.json 中 feature.platform）
- `mainHide`
  - 若配置为`true`，打开此功能不主动显示搜索框。（可参考 plugin.json 中 feature.mainHide）
- `mainPush`
  - 是否向搜索框推送内容。（可参考 plugin.json 中 feature.mainPush）
- `cmds`
  - 指令集合（可参考 plugin.json 中 feature.cmds）

:::

### 示例代码

```js
// 获取所有动态功能
const features = utools.getFeatures();
console.log(features);
// 获取特定 code
const features = utools.getFeatures(["code-1", "code-2"]);
console.log(features);
```

## `utools.setFeature(feature)`

为本插件应用动态新增某个功能。

### 类型定义

```ts
function setFeature(feature: Feature): void;
```

- `feature` 类型参考 [`Feature` 类型定义](#def-feature)

### 示例代码

```js
utools.setFeature({
  code: Date.now().toString(),
  explain: "测试动态功能",
  // "icon": "res/xxx.png",
  // "icon": "data:image/png;base64,xxx...",
  // "platform": ["win32", "darwin", "linux"]
  cmds: ["测试"],
});
```

## `utools.removeFeature(code)`

动态删除本插件应用的某个功能。

### 类型定义

```ts
function removeFeature(code: string): Boolean;
```

- `code` 要删除的功能编码

### 示例代码

```js
utools.removeFeature("code");
```

## `utools.redirectHotKeySetting(cmdLabel[, autocopy])`

跳转(前往) uTools 设置界面，引导用户配置指令全局快捷键

### 类型定义

```ts
function redirectHotKeySetting(cmdLabel: string, autocopy?: boolean): void;
```

- `cmdLabel` 指令名称
- `autocopy` 是否自动复制（默认为 `false`），如果设置为 `true` `cmdLabel` 应设置为「匹配指令」名称

### 示例代码

```js
utools.redirectHotKeySetting("剪贴板");
utools.redirectHotKeySetting("问 AI", true);
```


## `utools.redirectAiModelsSetting()`

跳转(前往) uTools 自定义 AI 模型设置界面，可引导用户自定义 AI 模型，一次配置全平台通用

### 类型定义

```ts
function redirectAiModelsSetting(): void;
```

### 示例代码

```js
utools.redirectAiModelsSetting();
```

# 模拟按键

模拟用户的键盘与鼠标操作。

## `utools.simulateKeyboardTap(key[, ...modifiers])`

模拟键盘按键

### 类型定义

```ts
function simulateKeyboardTap(key: string, ...modifiers: string[]): void;
```

- `key`: 要模拟的按键
- `modifiers`: 要模拟的修饰键，一般为 `shift`、`ctrl`、`alt`、`meta`

### 示例代码

```js
// 模拟键盘敲击 Enter
utools.simulateKeyboardTap("enter");
// windows linux 模拟粘贴
utools.simulateKeyboardTap("v", "ctrl");
// macOS 模拟粘贴
utools.simulateKeyboardTap("v", "command");
// 模拟 Ctrl + Alt + A
utools.simulateKeyboardTap("a", "ctrl", "alt");
```

## `utools.simulateMouseMove(x, y)`

模拟鼠标移动到指定位置

### 类型定义

```ts
function simulateMouseMove(x: number, y: number): void;
```

- `x` 距离屏幕左侧的位置(像素)
- `y` 距离屏幕顶部的位置(像素)

### 示例代码

```js
// 将鼠标移动到屏幕左上角
utools.simulateMouseMove(50, 50);
```

## `utools.simulateMouseClick(x, y)`

模拟鼠标左键点击

### 类型定义

```ts
function simulateMouseClick(x: number, y: number): void;
```

- `x` 距离屏幕左侧的位置(像素)
- `y` 距离屏幕顶部的位置(像素)

### 示例代码

```js
// 在屏幕距离左侧 100 像素顶部 100 像素的位置点击
utools.simulateMouseClick(100, 100);
```

## `utools.simulateMouseDoubleClick(x, y)`

模拟鼠标左键双击

### 类型定义

```ts
function simulateMouseDoubleClick(x: number, y: number): void;
```

- `x` 距离屏幕左侧的位置(像素)
- `y` 距离屏幕顶部的位置(像素)

### 示例代码

```js
// 在屏幕距离左侧 100 像素顶部 100 像素的位置双击
utools.simulateMouseDoubleClick(100, 100);
```

## `utools.simulateMouseRightClick(x, y)`

模拟鼠标右键点击

### 类型定义

```ts
function simulateMouseRightClick(x: number, y: number): void;
```

- `x` 距离屏幕左侧的位置(像素)
- `y` 距离屏幕顶部的位置(像素)

### 示例代码

```js
// 在屏幕距离左侧 100 像素顶部 100 像素的位置右击
utools.simulateMouseRightClick(100, 100);
```


# AI

调用 AI 能力，支持 **Function Calling**

## `utools.ai(option[, streamCallback])`

调用 AI

### 类型定义

::: code-group

```ts [流式调用]
function ai(
  option: AiOption,
  streamCallback: (chunk: Message) => void
): PromiseLike<void>; // 版本：>=7.0.0
```

```ts [非流式调用]
function ai(option: AiOption): PromiseLike<Message>; // 版本：>=7.0.0
```

:::

- `option`: Ai 选项
- `streamCallback`: 流式调用函数 (可选)
- 返回定制的 `PromiseLike`

::: details `AiOption` 类型定义

```ts
interface AiOption {
  model?: string;
  messages: Message[];
  tools?: Tool[];
}
```

#### AiOption 字段说明

- `model`
  - AI 模型, 为空默认使用 _deepseek-v3_
- `messages`
  - 消息列表
- `tools`
  - 工具列表

:::

::: details `Message` 类型定义

```ts
interface Message {
  role: "system" | "user" | "assistant";
  content?: string;
  reasoning_content?: string;
}
```

#### Message 字段说明

- `role`
  - 消息角色
    - `system`：系统消息
    - `user`：用户消息
    - `assistant`：AI 消息
- `content`
  - 消息内容
- `reasoning_content`
  - 消息推理内容，一般只有推理模型会返回

:::

::: details `Tool` 类型定义

```ts
interface Tool {
  type: "function";
  function?: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
    };
    required?: string[];
  };
}
```

#### Tool 字段说明

- `type`
  - 工具类型
    - `function`：函数工具
- `function`
  - 函数工具配置
    - `name`：函数名称
    - `description`：函数描述
    - `parameters`：函数参数
      - `type`：参数类型
      - `properties`：参数属性
    - `required`：必填参数

:::

::: warning `PromiseLike` 类型定义

`PromiseLike` 是 `Promise` 的扩展类型，包含 `abort()` 函数

默认情况下，你可以单纯把它当作 `Promise` 来使用，但是扩展了 `abort()` 函数，可以让你在调用 AI 过程中，执行 `abort()` 中止调用。

```ts
interface PromiseLike<T> extends Promise<T> {
  abort(): void;
}
```

#### PromiseLike 字段说明

- `abort()`
  - 中止 AI 调用

:::

### 示例代码

---

#### AI 对话

::: code-group

```js [流式调用]
const messages = [
  {
    role: "system",
    content:
      "你是一个英文翻译专家，将用户的任何内容都翻译成英文，翻译结果要符合英文语言习惯",
  },
  {
    role: "user",
    content: "uTools 是一种高效工作方式",
  },
];

await utools.ai({ messages }, (chunk) => {
  console.log(chunk);
});
```

```js [非流式调用]
const messages = [
  {
    role: "system",
    content:
      "你是一个英文翻译专家，将用户的任何内容都翻译成英文，翻译结果要符合英文语言习惯",
  },
  {
    role: "user",
    content: "uTools 是一种高效工作方式",
  },
];

const result = await utools.ai({ messages });
console.log(result.content);
```

:::

---

#### Function Calling 调用

::: warning

**Function Calling** 功能调用的函数**必须**挂到 `window` 对象上，例如：`window.getSystemInfo`
:::

::: code-group

```js [App.jsx]
const messages = [
  {
    role: "user",
    content: "我电脑的 CPU 是什么，内存多大",
  },
];
const tools = [
  {
    type: "function",
    function: {
      name: "getSystemInfo",
      description: "获取用户的电脑信息",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

// 流式调用
await utools.ai({ messages, tools }, (delta) => {
  console.log(delta);
});
// 非流式调用
const result = await utools.ai({ messages, tools });
console.log(result.content);
```

```js [preload.js]
window.getSystemInfo = () => {
  const os = require("node:os");
  return {
    // 操作系统信息
    platform: os.platform(), // 平台
    type: os.type(), // 操作系统类型
    release: os.release(), // 操作系统版本
    arch: os.arch(), // CPU 架构
    // CPU 信息
    cpus: os.cpus(), // CPU 核心信息
    cpuCount: os.cpus().length, // CPU 核心数
    // 内存信息
    totalMemory: (os.totalmem() / (1024 * 1024)).toFixed(2) + " MB", // 总内存
    freeMemory: (os.freemem() / (1024 * 1024)).toFixed(2) + " MB", // 空闲内存
    // 系统运行时间
    uptime: (os.uptime() / 3600).toFixed(2) + " 小时", // 系统运行时间
    // 用户信息
    homedir: os.homedir(), // 用户主目录
    userInfo: os.userInfo(), // 当前用户信息
    // 网络信息
    networkInterfaces: os.networkInterfaces(), // 网络接口信息
    // 系统负载
    loadavg: os.loadavg(), // 系统负载
    // 系统时间
    currentTime: new Date().toLocaleString(), // 当前系统时间
    // 其他信息
    hostname: os.hostname(), // 主机名
    tempDir: os.tmpdir(), // 临时目录
  };
};
```

:::

## `utools.allAiModels()`

获取所有 AI 模型

### 类型定义

```ts
function allAiModels(): Promise<AiModel[]>; // 版本：>=7.0.0
```

- 在 `Promise` 内返回 `AiModel` 数组

### AiModel 类型定义

::: details `AiModel` 类型定义

```ts
interface AiModel {
  id: string;
  label: string;
  description: string;
  icon: string;
  cost: number;
}
```

#### AiModel 字段说明

- `id`
  - AI 模型 ID，用于 `utools.ai` 调用的 `model` 参数
- `label`
  - AI 模型名称
- `description`
  - AI 模型描述
- `icon`
  - AI 模型图标
- `cost`
  - AI 模型调用消耗

:::

### 示例代码

```js
const models = await utools.allAiModels();
console.log(models);
```


# FFmpeg

[FFmpeg](https://ffmpeg.org) 是一款功能强大的开源音视频处理工具，将其以独立扩展的方式集成到 uTools。(首次调用 FFmpeg 会引导用户下载集成)

## `utools.runFFmpeg(args[, onProgress])`

运行 FFmpeg (首次调用将引导用户下载集成)

### 类型定义

```ts
function runFFmpeg(args: string[], onProgress?: (progress: RunProgress) => void): PromiseLike<void>; // 版本：>=6.1.0
```

- `args`: ffmpeg 运行参数(数组)
- `onProgress`: 处理进度中的回调函数
- 返回 Promise

::: warning `PromiseLike` 类型定义

`PromiseLike` 是 `Promise` 的扩展类型，包含 `kill()` 和 `quit()` 函数

默认情况下，你可以单纯把它当作 `Promise` 来使用，但是扩展了 `kill()` 和 `quit()` 函数，可以让你在运行过程中强制结束 FFmpeg 运行，或者通知 FFmpeg 退出。

```ts
interface PromiseLike extends Promise<void> {
  kill(): void;
  quit(): void;
}
```

#### PromiseLike 字段说明

- `kill()`
  - 强制结束 FFmpeg 运行
- `quit()`
  - 通知 FFmpeg 退出，类似命令行下按 q 键

:::

::: details `RunProgress` 类型定义

```ts
interface RunProgress {
  bitrate: string;
  fps: number;
  frame: number;
  percent?: number;
  q: number | string;
  size: string;
  speed: string;
  time: string;
}
```

#### RunProgress 字段说明

- `bitrate`
  - 视频或音频的比特率，表示每秒传输的比特数
- `fps`
  - 当前处理的视频帧率，每秒处理的帧数
- `frame`
  - 已处理的帧数
- `percent`
  - 处理完成百分比
- `q`
  - 质量指标
- `size`
  - 已处理输出的文件大小
- `speed`
  - 当前的处理速度
- `time`
  - 前已处理的时间

:::

### 示例代码

```js
// 视频压缩
utools.runFFmpeg(
  ["-i", "/path/to/input.mp4", "-c:v", "libx264", "-tag:v", "avc1-movflags", "faststart", "-crf", "30", "-preset", "superfast", "pathto/output.mp4"],
  (progress) => {
    console.log("压缩中 " + progress.percent + "%");
  }
).then(() => {
  console.log("压缩完成");
}).catch((error) => {
  console.log("出错了：" + error.message);
});
```

```js
// 视频转 GIF
const run = utools.runFFmpeg(
  [ "-i", "/path/to/input.mp4", "-filter_complex", "[0]fps=15,split[v0][v1];[v0]palettegen=stats_mode=full[p];[v1][p]paletteuse", "/path/to/output.gif" ],
  () => {
    console.log("转换中 " + progress.percent + "%");
  }
);
run.then(() => {
  console.log("转换完成");
}).catch((error) => {
  console.log("出错了：" + error.message);
});

// 可执行 run.kill() 强制结束转换
```

```js
// 音频提取
utools.runFFmpeg(["-i", "/path/to/input.mp4", "-q:a", "0", "-map", "a", "/path/to/output.mp3"]).then(() => {
  console.log("提取完成");
}).catch((error) => {
  console.log("出错了：" + error.message);
});
```

```js
// Windows 录屏
const run = utools.runFFmpeg(['-f', 'gdigrab', '-framerate', '30', '-i', 'desktop', '/path/to/output.mp4'])

// macOS 录屏
const run = utools.runFFmpeg(['-f', 'avfoundation', '-framerate', '30', '-i', 'default', '/path/to/output.mp4'])

// Linux 录屏
const run = utools.runFFmpeg(['-f', 'x11grab', '-framerate', '30', '-i', ':0.0', '/path/to/output.mp4'])

setTimeout(() => {
  //执行 run.quit() 结束录屏
  run.quit()
}, 10000)

```

```js
// Windows 截屏
utools.runFFmpeg(['-f', 'gdigrab', '-i', 'desktop', '-vframes', '1', '/path/to/screenshot.png'])

// macOS 截屏
utools.runFFmpeg(['-f', 'avfoundation', '-i', 'default', '-vframes', '1', '/path/to/screenshot.png'])

// Linux 截屏
utools.runFFmpeg(['-f', 'x11grab', '-i', ':0.0', '-vframes', '1', '/path/to/screenshot.png'])

```


# 本地数据库

uTools 提供了本地数据库的 API，基于 nosql 的设计，通过它可以实现一些简单的数据存储和读取。
它可以很方便的使用，数据存储在本地计算机系统，如果用户开启数据同步，可**备份**到 uTools 服务端同时可在用户的多个设备间实现**秒级同步**。
uTools 的插件应用是一个轻型的应用程序，在没有远端服务器提供数据存储，提供本地数据持久化存储至关重要。

::: warning 警告
在多个设备编辑同一个数据库文档时，将产生冲突，数据库会统一选择一个版本作为最终版本，为了尽可能避免冲突，应该将内容合理的分散在多个文档，而不是都存放在一个数据库文档中。
:::

## `utools.db.put(doc)` / `utools.db.promises.put(doc)`

创建或更新数据库文档，文档内容不超过 **1M**

### 类型定义

::: code-group

```ts [同步版本]
function put(doc: DbDoc): DbResult;
```

```ts [异步版本]
function put(doc: DbDoc): Promise<DbResult>;
```

:::

- `doc` 文档对象

::: details `DbDoc` 类型定义 {#def-dbdoc}

```ts
interface DbDoc {
  _id: string;
  _rev?: string;
  [key:string]: unknown
}
```

#### 字段说明

- `_id`
  - 文档 ID，如果 `_id` 不存在，则创建一个新文档，如果 `_id` 已经存在，则更新文档。
- `_rev`
  - 文档版本，对文档更新时，`_rev` 不可省略，否则将更新失败。

:::

::: details `DbResult` 类型定义 {#def-dbresult}

```ts
interface DbResult {
  id: string,
  rev?: string,
  ok?: boolean,
  error?: boolean,
  name?: string,
  message?: string
}
```

#### 字段说明

- `id`
  - 文档 ID，即文档字段 `_id`。
- `rev`
  - 最新文档版本
- `ok`
  - 是否成功
- `error`
  - 是否错误
- `name`
  - 错误名称
- `message`
  - 错误原因
:::

### 示例代码

::: code-group

```ts [同步版本]
// 新建文档
const doc = {
  _id: "test/doc-1",
  a: "value 1",
  b: "value 2"
}
let result = utools.db.put(doc);
if (result.ok) {
  // 保存成功, 更新文档版本
  doc._rev = result.rev;
} else if (result.error) {
  // 保存出错，打印错误原因
  console.log(result.message);
}

// 修改文档
doc.a = "updated value 1";
doc.b = "updated value 2";
result = utools.db.put(doc);
if (result.ok) {
  // 保存成功, 更新文档版本
  doc._rev = result.rev;
} else if (result.error) {
  // 保存出错，打印错误原因
  console.log(result.message);
}
```

```ts [异步版本]
// 新建文档
const doc = {
  _id: "test/doc-1",
  a: "value 1",
  b: "value 2"
}
let result = await utools.db.promises.put(doc);
if (result.ok) {
  // 保存成功, 更新文档版本
  doc._rev = result.rev;
} else if (result.error) {
  // 保存出错，打印错误原因
  console.log(result.message);
}

// 修改文档
doc.a = "updated value 1";
doc.b = "updated value 2";
result = await utools.db.promises.put(doc);
if (result.ok) {
  // 保存成功, 更新文档版本
  doc._rev = result.rev;
} else if (result.error) {
  // 保存出错，打印错误原因
  console.log(result.message);
}
```

:::

## `utools.db.get(id)` / `utools.db.promises.get(id)`

根据文档 ID `id` 获取文档，不存在则返回 null

### 类型定义

::: code-group

```ts [同步版本]
function get(id: string): DbDoc | null;
```

```ts [异步版本]
function get(id: string): Promise<DbDoc | null>;
```

:::

- `id` 文档 ID
- DbDoc 参考 [`DbDoc` 类型定义](#def-dbdoc)


### 示例代码

::: code-group

```ts [同步版本]
// 获取文档
const doc = utools.db.get("test/doc-1");
console.log(doc);
if (doc) {
  // 修改文档
  doc.c = 123;
  result = utools.db.put(doc);
  if (result.ok) {
    // 保存成功, 更新文档版本
    doc._rev = result.rev;
  } else if (result.error) {
    // 保存出错，打印错误原因
    console.log(result.message);
  }
}
```

```ts [异步版本]
// 获取文档
const doc = await utools.db.promises.get("test/doc-1");
console.log(doc);
if (doc) {
  // 修改文档
  doc.c = 123;
  result = await utools.db.promises.put(doc);
  if (result.ok) {
    // 保存成功, 更新文档版本
    doc._rev = result.rev;
  } else if (result.error) {
    // 保存出错，打印错误原因
    console.log(result.message);
  }
}
```

:::

## `utools.db.remove(doc)` / `utools.db.promises.remove(doc)`

删除数据库文档，可以通过文档对象或者文档 `id` 删除

### 类型定义

::: code-group

```ts [同步版本]
function remove(doc: DbDoc): DbResult;
function remove(id: string): DbResult;
```

```ts [异步版本]
function remove(doc: DbDoc): Promise<DbResult>;
function remove(id: string): Promise<DbResult>;
```

:::

- `doc` 文档对象
- `id` 文档 ID
- DBResult 参考 [`DbResult` 类型定义](#def-dbresult)

### 示例代码

::: code-group

```ts [同步版本]
// 删除文档
const doc = utools.db.get("test/doc-1");
if (doc) {
  const result = utools.db.remove(doc);
  if (result.ok) {
    console.log("删除成功");
  } else if (result.error) {
    // 删除失败，打印错误原因
    console.log(result.message);
  }
}

// 根据文档 ID 删除文档
const result = utools.db.remove("test/doc-1");
if (result.ok) {
  console.log("删除成功");
} else if (result.error) {
  // 删除失败，打印错误原因
  console.log(result.message);
}
```

```ts [异步版本]
// 删除文档
const doc = await utools.db.promises.get("test/doc-1");
if (doc) {
  const result = await utools.db.promises.remove(doc);
  if (result.ok) {
    console.log("删除成功");
  } else if (result.error) {
    // 删除失败，打印错误原因
    console.log(result.message);
  }
}

// 根据文档 ID 删除文档
const result = await utools.db.promises.remove("test/doc-1");
if (result.ok) {
  console.log("删除成功");
} else if (result.error) {
  // 删除失败，打印错误原因
  console.log(result.message);
}
```

:::

## `utools.db.bulkDocs(docs)` / `utools.db.promises.bulkDocs(docs)`

批量创建或更新数据库文档

### 类型定义

::: code-group

```ts [同步版本]
function bulkDocs(docs: DbDoc[]): DbResult[];
```

```ts [异步版本]
function bulkDocs(docs: DbDoc[]): Promise<DbResult[]>;
```

:::

- `docs` 文档对象数据
- DbDoc 参考 [`DbDoc` 类型定义](#def-DbDoc)
- DbResult 参考 [`DbResult` 类型定义](#def-dbresult)

### 示例代码

::: code-group

```ts [同步版本]
// 批量创建文档
const docs = [
  { _id: "test/doc-2", a: "a 2222222", b: "b 2222222" },
  { _id: "test/doc-3", b: "a 3333333", b: "b 3333333" }
];
const results = utools.db.bulkDocs(docs);
results.forEach(ret => {
  // 更新文档版本
  if (ret.ok) {
    docs.find(x => x._id === ret.id)?._rev = ret.rev;
  }
})
```

```ts [异步版本]
// 批量创建文档
const docs = [
  { _id: "test/doc-2", a: "a 2222222", b: "b 2222222" },
  { _id: "test/doc-3", b: "a 3333333", b: "b 3333333" }
];
const results = await utools.db.promises.bulkDocs(docs);
results.forEach(ret => {
  // 更新文档版本
  if (ret.ok) {
    docs.find(x => x._id === ret.id)?._rev = ret.rev;
  }
})
```

:::

## `utools.db.allDocs([idStartsWith])` / `utools.db.promises.allDocs([idStartsWith])`

筛选获取插件应用文档数组，参数为字符串则匹配文档 ID 前缀来过滤。参数为数组则查找数组内 id 对应的文档。不传参数则返回所有文档。

### 类型定义

::: code-group

```ts [同步版本]
function allDocs(idStartsWith?: string): DbDoc[];
function allDocs(ids: string[]): DbDoc[];
```

```ts [异步版本]
function allDocs(idStartsWith?: string): Promise<DbDoc[]>;
function allDocs(ids: string[]): Promise<DbDoc[]>;
```

:::

- `idStartsWith` 文档 ID 前缀
- `ids` 文档 ID 数组
- `DbDoc` 参考 [`DbDoc` 类型定义](#def-dbdoc)

### 示例代码

::: code-group

```ts [同步版本]
// 获取所有 id 以 "test/" 作为前缀的文档
const docs1 = utools.db.allDocs("test/");
// 根据 id 数组获取对应文档数组
const docs2 = utools.db.allDocs(["test/doc-2", "test/doc-3"]);
// 获取插件应用所有文档
const docs3 = utools.db.allDocs();
console.log(docs1, docs2, docs3)
```

```ts [异步版本]
// 获取所有 id 以 "test/" 作为前缀的文档
const docs1 = await utools.db.promises.allDocs("test/");
// 根据 id 数组获取对应文档数组
const docs2 = await utools.db.promises.allDocs(["test/doc-2", "test/doc-3"]);
// 获取插件应用所有文档
const docs3 = await utools.db.promises.allDocs();
console.log(docs1, docs2, docs3)
```

:::

## `utools.db.postAttachment(id, attachment, type)` / `utools.db.promises.postAttachment(id, attachment, type)`

存储附件到新文档，附件只能被创建不能被更新，创建的附件最大不超过 10M

### 类型定义

::: code-group

```ts [同步版本]
function postAttachment(id: string, attachment: Buffer | Uint8Array, type: string): DbResult;
```

```ts [异步版本]
function postAttachment(id: string, attachment: Buffer | Uint8Array, type: string): Promise<DbResult>;
```

:::

- `id` 文档 ID
- `attachment` 附件 Buffer
- `type` 为附件类型，参考 [mime/type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types)，比如 `image/png`、`text/plain` 。
- `DbResult` 参考 [`DbResult` 类型定义](#def-dbresult)


### 示例代码

::: code-group

```ts [同步版本]
const fileBuffer = fs.readFileSync("/path/to/test.png");
const result = utools.db.postAttachment("test-image-file", fileBuffer, "image/png");
if (result.ok) {
  console.log("附件存储成功");
} else if (result.error) {
  // 存储失败，打印错误原因
  console.log(result.message);
}
```

```ts [异步版本]
const fileBuffer = fs.promises.readFile("/path/to/test.png");
const result = await utools.db.promises.postAttachment("test-image-file", fileBuffer, "image/png");
if (result.ok) {
  console.log("附件存储成功");
} else if (result.error) {
  // 存储失败，打印错误原因
  console.log(result.message);
}
```

:::

## `utools.db.getAttachment(id)` / `utools.db.promises.getAttachment(id)`

获取附件，不存在返回 null

### 类型定义

::: code-group

```ts [同步版本]
function getAttachment(id: string): Uint8Array;
```

```ts [异步版本]
function getAttachment(id: string): Promise<Uint8Array>;
```
:::

- `id` 附件文档 ID

### 示例代码

::: code-group

```ts [同步版本]
const buf = utools.db.getAttachment("test-image-file");
if (buf) {
  fs.writeFileSync(utools.getPath('downloads') + "/test.png", buf);
}
```

```ts [异步版本]
const buf = await utools.db.promises.getAttachment("test-image-file");
if (buf) {
  await fs.promises.writeFile(utools.getPath('downloads') + "/test.png", buf);
}
```

:::

## `utools.db.getAttachmentType(id)` / `utools.db.promises.getAttachmentType(id)`

获取附件类型

### 类型定义

::: code-group

```ts [同步版本]
function getAttachmentType(id: string): string;
```

```ts [异步版本]
function getAttachmentType(id: string): Promise<string>;
```

:::

- `id` 附件文档 ID

### 示例代码

::: code-group

```ts [同步版本]
const type = utools.db.getAttachmentType("test-image-file");
console.log("附件类型为", type);
```

```ts [异步版本]
const type = await utools.db.promises.getAttachmentType("test-image-file");
console.log("附件类型为", type);
```

:::

## `utools.db.replicateStateFromCloud()` / `utools.db.promises.replicateStateFromCloud()` {#db-sync}

云端同步数据到本地的状态，该 API 是解决在某些环境下需要判断数据是否从云端复制完成。

### 类型定义

::: code-group

```ts [同步版本]
function replicateStateFromCloud(): State;
```

```ts [异步版本]
function replicateStateFromCloud(): Promise<State>;
```

:::

::: details `State` 类型定义

```ts
type State = null | 0 | 1;
```

- `null`: 未开启数据同步
- `0`: 已完成同步
- `1`: 同步中

:::

### 示例代码

::: code-group

```ts [同步版本]
const state = utools.db.replicateStateFromCloud();
if (state === 1) {
  console.log("数据从云端拉取同步中...");
} else {
  console.log("数据已从云端同步完成");
}
```

```ts [异步版本]
const state = await utools.db.promises.replicateStateFromCloud();
if (state === 1) {
  console.log("数据从云端拉取同步中...");
} else {
  console.log("数据已从云端同步完成");
}
```

:::


# dbStorage

dbStorage 是基于 [本地数据库](./local-db.md) 基础上，封装的一套类似 [LocalStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage) 的 API，通过键值对形式存储数据，可以快速存取数据。

## `utools.dbStorage.setItem(key, value)`

存储一个键值对数据，若键已存在，则覆盖它的值。

### 类型定义

```ts
function setItem(key: string, value: any): void;
```

- `key` 键值
- `value` 值

### 示例代码

```js
utools.dbStorage.setItem("key", "value");
```

## `utools.dbStorage.getItem(key)`

获取一个键值对数据。

### 类型定义

```ts
function getItem(key: string): any;
```

- `key` 键值

### 示例代码

```js
const value = utools.dbStorage.getItem("key");
console.log(value);
```

## `utools.dbStorage.removeItem(key)`

删除一个键值对数据。

### 类型定义

```ts
function removeItem(key: string): void;
```

- `key` 键值

### 示例代码

```js
utools.dbStorage.removeItem("key");
```


# dbCryptoStorage

dbCryptoStorage 是基于 [本地数据库](./local-db.md) 基础上，封装的一套类似 [LocalStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage) 的 API，通过键值对形式加密存储数据。

## `utools.dbCryptoStorage.setItem(key, value)`

存储一个键值对数据，若键已存在，则覆盖它的值。

### 类型定义

```ts
function setItem(key: string, value: any): void;
```

- `key` 键值
- `value` 要加密存储的值

### 示例代码

```js
utools.dbCryptoStorage.setItem("key", "value will encrypt");
```

## `utools.dbCryptoStorage.getItem(key)`

获取一个键值对数据。

### 类型定义

```ts
function getItem(key: string): any;
```

- `key` 键值

### 示例代码

```js
const value = utools.dbCryptoStorage.getItem("key");
console.log(value);
```

## `utools.dbCryptoStorage.removeItem(key)`

删除一个键值对数据。

### 类型定义

```ts
function removeItem(key: string): void;
```

- `key` 键值

### 示例代码

```js
utools.dbCryptoStorage.removeItem("key");
```


# 可编程浏览器

uTools browser 简称 ubrowser，是根据 uTools 的特性，量身打造的一个可编程浏览器。利用 ubrowser 可以轻而易举连接一切互联网服务，且与 uTools 完美结合。

::: tip 小技巧
ubrowser 拥有优雅的链式调用接口，可以用口语化的数行代码，实现一系列匪夷所思的操作。例如：

1. RPA 自动化
2. 网页内容魔改
3. 网页内容抓取

:::

### `ubrowser.goto(url[, headers][, timeout])`

打开一个 ubrowser 窗口，并跳转到指定网页

#### 类型定义

```ts
function goto(
  url: string,
  headers?: Record<string, string>,
  timeout?: number
): UBrowser;
```

- `url`: 要跳转的网页地址
- `headers`: 请求头
- `timeout`: 超时时间，单位毫秒

### `ubrowser.useragent(ua)`

设置用户代理（User-Agent）

#### 类型定义

```ts
function useragent(ua: string): UBrowser;
```

- `ua`: User-Agent 字符串

### `ubrowser.viewport(width, height)`

设置浏览器视窗大小

#### 类型定义

```ts
function viewport(width: number, height: number): UBrowser;
```

- `width`: 视窗宽度
- `height`: 视窗高度

### `ubrowser.hide()`

隐藏 ubrowser 窗口

#### 类型定义

```ts
function hide(): UBrowser;
```

### `ubrowser.show()`

显示 ubrowser 窗口

#### 类型定义

```ts
function show(): UBrowser;
```

## 网页操作

ubrowser 支持网页内容魔改，即在网页加载前对网页内容进行修改，例如添加自定义 CSS、JavaScript 等。

### `ubrowser.css(css)`

添加自定义 CSS

#### 类型定义

```ts
function css(css: string): UBrowser;
```

- `css`: 自定义 CSS

### `ubrowser.evaluate(func[, params])`

在网页中执行自定义 JS 代码

#### 类型定义

```ts
function evaluate(func: Function, params?: any[]): UBrowser;
```

- `func`: 网页内执行的 JS 函数，函数若有返回值，则会在 `run` Promise 结果返回
- `params`: 传递给`func`的参数

### `ubrowser.press(key[, modifiers])`

模拟键盘按键

#### 类型定义

```ts
function press(key: string, ...modifiers: string[]): UBrowser;
```

- `key`: 要模拟的按键
- `modifiers`: 要模拟的修饰键，一般为 `shift`、`ctrl`、`alt`、`meta`

### `ubrowser.click(selector)`

执行点击操作

#### 类型定义

```ts
function click(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.mousedown(selector)`

执行鼠标按下操作

#### 类型定义

```ts
function mousedown(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.mouseup(selector)`

执行鼠标抬起操作

#### 类型定义

```ts
function mouseup(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.file(selector, payload)`

对网页中的 input 元素设置文件

#### 类型定义

```ts
function file(selector: string, payload: string | string[] | Buffer): UBrowser;
```

- `selector` 元素必须是可选择文件的输入元素 `input[type=file]`
- `payload` 可以是文件路径、文件路径集合以及文件 Buffer

### `ubrowser.value(selector, payload)`

对网页中的 input 元素设置值

#### 类型定义

```ts
function value(selector: string, payload: string): UBrowser;
```

- `selector` 必须是 `input`、`textarea`、`select` 元素，使用 CSS 选择器或 XPath 选择器
- `payload` 将会设置到 `value` 属性上

### `ubrowser.check(selector, checked)`

执行勾选操作

#### 类型定义

```ts
function check(selector: string, checked: boolean): UBrowser;
```

- `selector` 必须是 `checkbox`、`radio` 元素，使用 CSS 选择器或 XPath 选择器
- `checked` 为 `true` 时，勾选，否则取消勾选

### `ubrowser.focus(selector)`

执行聚焦操作

#### 类型定义

```ts
function focus(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.scroll(selector)`

执行滚动操作

#### 类型定义

```ts
function scroll(selector: string): UBrowser;
function scroll(y: number): UBrowser;
function scroll(x: number, y: number): UBrowser;
```

- `selector` 为 `string` 时，滚动到指定元素, 使用 CSS 选择器或 XPath 选择器
- `selector` 为 `number` 时，只有一个参数表示 y 轴，滚动到纵向指定位置。两个参数则表示 x 轴。
- 传递 `x` 和 `y`，滚动到指定位置

### `ubrowser.download(url[, savePath])`

执行下载操作

#### 类型定义

```ts
function download(url: string, savePath?: string): UBrowser;
function download(
  func: (...params: any[]) => string,
  savePath: string | null,
  ...params: any[]
): UBrowser;
```

- `url` 待下载的资源 URL
- `savePath` 指定下载路径，不传则下载到默认路径
- `func` 网页内执行的 JS 函数, 函数可返回资源 URL，再根据返回 URL 下载资源
- `params` 传递给 `func` 的参数

### `ubrowser.paste(text)`

先复制再执行粘贴操作

#### 类型定义

```ts
function paste(text: string): UBrowser;
```

- `text`: 要粘贴的内容，支持普通文本跟图像 Base64 Data URL

### `ubrowser.screenshot(target[, savePath])`

对网页进行截屏并保持到指定路径，将会保存成为 png 格式

#### 类型定义

```ts
function screenshot(target?: string | Rect, savePath?: string): UBrowser;
```

- 没有参数时，整个网页窗口截屏
- 当 `target` 为 `string` 时，`target` 为选择器。可以传入一个 `Rect` 对象，表示截取指定区域。
- `savePath` 保存路径，没有传递 `savePath` 的时，默认存储在临时目录。

::: details `Rect` 类型定义

```ts
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

:::

### `ubrowser.markdown([selector])`

将当前网页内容转换为 markdown

#### 类型定义

```ts
function markdown(selector?: string): UBrowser;
```

- `selector`: 可选，指定要转换的元素，使用 CSS 选择器或 XPath 选择器，不传递则转换整个网页内容

### `ubrowser.pdf(options[, savePath])`

将网页保存为 PDF

#### 类型定义

```ts
function pdf(options: PdfOptions, savePath?: string): UBrowser;
```

- `PdfOptions` 参考 [Electron `PrintToPDFOptions`](https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions)
  >
- `savePath` 保存路径，没有传递 `savePath` 的时，默认存储在临时目录。

### `ubrowser.device(options)`

模拟移动设备

#### 类型定义

```ts
function device(options: DeviceOptions): UBrowser;
```

- `options` 模拟设备信息

::: details `DeviceOptions` 类型定义

```ts
interface DeviceOptions {
  userAgent: string;
  size: {
    width: number;
    height: number;
  };
}
```

:::

### `ubrowser.wait(ms)`

执行等待操作

#### 类型定义

```ts
// 等待时间
function wait(ms: number): this;
// 等待元素出现
function wait(selector: string, timeout?: number): this;
// 等待函数返回 true
function wait(
  func: (...params: any[]) => boolean,
  timeout?: number,
  ...params: any[]
): this;
```

- `ms` 等待指定毫秒数
- `selector` 等待元素出现，使用 CSS 选择器或 XPath 选择器
- `timeout` 等待超时时间，默认为 60000 ms (60 秒)
- `func` 网页内执行的 JS 函数, 返回 `true` 等待结束
- `params` 传递给 `func` 的参数

### `ubrowser.when(selector)`

条件判断

#### 类型定义

```ts
// 判断存在元素
function when(selector: string): UBrowser;
// 判断函数结果
function when(func: (...params: any[]) => boolean, ...params: any[]): UBrowser;
```

- `selector` 判断是否存在元素，使用 CSS 选择器或 XPath 选择器
- `func` 网页内执行的 JS 函数, 判断函数返回的结果
- `params` 传递给 `func` 的参数

### `ubrowser.end()`

结束上一个 `when`

#### 类型定义

```ts
function end(): UBrowser;
```

### `ubrowser.devTools([mode])`

打开 ubrowser 开发者工具。

#### 类型定义

```ts
function devTools(mode?: string): void;
```

- `mode`: 可选值 'right' | 'bottom' | 'undocked' | 'detach' ，默认 'detach'

### `ubrowser.cookies([name])`

获取 ubrowser cookie

#### 类型定义

```ts
// 在当前 url 根据名称获取 cookie, 为空获取当前 url 全部 cookie
function cookies(name?: string): UBrowser;
// 根据条件获取 Cookie
function cookies(filter: CookieFilter): UBrowser;
```

- `name` cookie 名称
- `filter` 过滤对象

::: details `CookieFilter` 类型定义

```ts
interface CookieFilter {
  url?: string;
  name?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  session?: boolean;
  httpOnly?: boolean;
}
```

- `url` 检索与 url 相关的 cookie。 空意味着检索所有 URL 的 cookie 。
- `name` 按名称筛选 cookie。
- `domain` 检索与域名或者 domain 子域名匹配的 cookie。
- `path` 检索路径与 path 匹配的 cookie。
- `secure` 通过其 Secure 属性筛选 cookie。
- `session` 筛选出 session 内可用或持久性 cookie。
- `httpOnly` 通过其 httpOnly 属性筛选 cookie。

:::

### `ubrowser.setCookies`

设置 ubrowser 的 cookie

#### 类型定义

```ts
function setCookies(name: string, value: string): UBrowser;
function setCookies(cookies: { name: string; value: string }[]): UBrowser;
```

- `name` cookie 名称
- `value` cookie 值
- `cookies` cookie 名称和值对象的集合

### `ubrowser.removeCookies(name)`

删除 ubrowser 的 cookie

#### 类型定义

```ts
function removeCookies(name: string): UBrowser;
```

- `name` cookie 名称

### `ubrowser.clearCookies([url])`

清空 ubrowser 的 cookie 信息。

#### 类型定义

```ts
function clearCookies(url?: string): UBrowser;
```

- `url`: 根据 url 清除 cookie，`clearCookies` 在 `goto` 函数之前调用时 `url` 不能为空。在 `goto` 之后调用则清空当前 url 的 cookie

### `ubrowser.run()`

开始运行 ubrowser 实例，并返回执行结果

#### 类型定义

```ts
function run(
  ubrowserId?: number,
  options?: UBrowserOptions
): Promise<[...any, UBrowserInstance]>;
```

- `ubrowserId` 一般以下两种形式获取：
  - `ubrowser.run` 返回的 `UBrowserInstance` 的 `id` 属性（ubrowser 窗口仍在显示时）。
  - [`utools.getIdleUBrowser`](./manage.md#utools-getidleubrowsers) 返回的 `UBrowserInstance` 的 `id` 属性。
- `run` 返回将会返回一个包含数组的 Promise 对象，数组的最后一个元素是当前未关闭窗口的 UBrowser 实例，其余的元素则是运行过程中，其他 ubrowser 方法的返回值，比如`evaluate`、`cookies`等。

::: details `UBrowserOptions` 类型定义

```ts
interface UBrowserOptions {
  show?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  center?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  fullscreenable?: boolean;
  enableLargerThanScreen?: boolean;
  opacity?: number;
  frame?: boolean;
  closable?: boolean;
  focusable?: boolean;
  skipTaskbar?: boolean;
  backgroundColor?: string;
  hasShadow?: boolean;
  transparent?: boolean;
  titleBarStyle?: string;
  thickFrame?: boolean;
}
```

- `show`: 是否显示浏览器窗口
- `width`: 浏览器窗口宽度，默认`800`
- `height`: 浏览器窗口高度，默认`600`
- `x`: 浏览器窗口位置 x 坐标
- `y`: 浏览器窗口位置 y 坐标
- `center`: 浏览器窗口是否居中
- `minWidth`: 浏览器窗口最小宽度，默认`0`
- `minHeight`: 浏览器窗口最小高度，默认`0`
- `maxWidth`: 浏览器窗口最大宽度，默认无限制
- `maxHeight`: 浏览器窗口最大高度，默认无限制
- `resizable`: 浏览器窗口是否可缩放，默认`true`
- `movable`: 浏览器窗口是否可移动，默认`true`
- `minimizable`: 浏览器窗口是否可最小化，默认`true`
- `maximizable`: 浏览器窗口是否可最大化，默认`true`
- `alwaysOnTop`: 浏览器窗口是否置顶，默认`false`
- `fullscreen`: 浏览器窗口是否全屏，默认`false`
- `fullscreenable`: 浏览器窗口是否可全屏，默认`true`
- `enableLargerThanScreen`: 浏览器窗口是否可超出屏幕，默认`false`，仅在 macOS 下生效
- `opacity`: 浏览器窗口透明度，默认`1`，支持`0`-`1`之间的值，仅在 macOS 跟 Windows 下生效
- `frame`: 浏览器窗口是否有边框，默认`true`
- `closable`: 浏览器窗口是否可关闭，默认`true`
- `focusable`: 浏览器窗口是否可聚焦，默认`true`
- `skipTaskbar`: 浏览器窗口是否跳过任务栏，默认`false`
- `backgroundColor`: 浏览器窗口背景颜色，默认`#ffffff`
- `hasShadow`: 浏览器窗口是否有阴影，默认`false`
- `transparent`: 浏览器窗口是否透明，默认`false`
- `titleBarStyle`: 浏览器窗口标题栏样式，默认`default`，可选值`hidden`、`hiddenInset`、`customButtonsOnHover`
- `thickFrame`: 浏览器窗口边框是否加粗，默认`false`

:::

::: details `UBrowserInstance` 类型定义 {#ubrowser-instance}

```ts
interface UBrowserInstance {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
}
```

:::

### 示例代码

```js
const address = "福州烟台山";
// 在地图上显示地址位置
utools.ubrowser
  // 打开百度地图站点
  .goto("https://map.baidu.com")
  // 等待出现搜索框
  .wait("#sole-input")
  // 搜索框获得焦点
  .focus("#sole-input")
  // 地址搜索框输入地址
  .value("#sole-input", address)
  // 等待 300 毫秒
  .wait(300)
  // 按下回车
  .press("enter")
  // 开始运行
  .run({ width: 1200, height: 800 });
```

```js
const expressNo = "YT8933937901850";
// 快递 100 查询快递单号
utools.ubrowser
  // 打开快递 100
  .goto("https://www.kuaidi100.com/")
  // 等待输入框
  .wait("#input")
  // 滚动到合适位置
  .scroll(0, 450)
  // 输入快递单号
  .value("#input", expressNo)
  // 点击查询
  .click("#query")
  // 开始运行(窗口大小 1280x720)
  .run({ width: 1280, height: 720 });
```

```js
const image = "/path/to/test.png";
// 图片自动去背景
utools.ubrowser
  // 清空 cookies
  .clearCookies("https://www.remove.bg")
  // 前往站点
  .goto("https://www.remove.bg/zh/upload")
  // 等界面加载出现上传按钮
  .wait('//div[text() = "上传图片"]')
  // 粘贴图片
  .paste(image)
  // 处理中，等待出现下载按钮
  .wait('//div[text() = "下载"]')
  // 再等待 3 秒，等结果返回
  .wait(3000)
  // 下载图片
  .download(function () {
    document
      .evaluate(
        '//div[text() = "下载"]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      .singleNodeValue?.click();
  }, utools.getPath("downloads") + "/removebg_" + Date.now() + ".png")
  // 关闭窗口
  .hide()
  // 开始运行
  .run({ width: 880, height: 720 });
```

```js
const filePath = `/path/to/test.zip`;
// 发送文件到微信文件传输助手
utools.ubrowser
  .goto("https://filehelper.weixin.qq.com")
  // 等待扫码登录
  .wait("textarea")
  // 上传文件，自动发送
  .file("#btnFile", filePath)
  // 开始运行
  .run({ width: 720, Height: 680 });
```

```js
const text = `https://pan.baidu.com/s/1ekPm-ooS0uvVA_J7ZqVGDQ 提取码: kvr5`;
const matchs = text.match(
  /(https?:\/\/[a-z0-9-._~:/?=#]+)\s*(?:\(|（)?(?:提取密?码?|访问密?码|密码)\s*(?::|：)?\s*([a-z0-9]{4,6})/i
);
// 网盘自动提取
utools.ubrowser
  // 打开网盘地址
  .goto(matchs[1])
  // 等待页面加载完成出现 input 元素
  .wait("input")
  // 等待 500 ms
  .wait(500)
  // 让提取码输入框获得焦点
  .evaluate(function () {
    const inputDoms = Array.from(document.querySelectorAll("input"));
    const targetInput =
      inputDoms.find(
        (x) =>
          x.placeholder.includes("提取码") || x.placeholder.includes("访问码")
      ) || inputDoms[0];
    targetInput.focus();
  })
  // 粘贴提取码
  .paste(matchs[2])
  // 等待 300 ms
  .wait(300)
  // 回车
  .press("enter")
  .run({ width: 1280, height: 720 });
```


# 可编程浏览器

uTools browser 简称 ubrowser，是根据 uTools 的特性，量身打造的一个可编程浏览器。利用 ubrowser 可以轻而易举连接一切互联网服务，且与 uTools 完美结合。

::: tip 小技巧
ubrowser 拥有优雅的链式调用接口，可以用口语化的数行代码，实现一系列匪夷所思的操作。例如：

1. RPA 自动化
2. 网页内容魔改
3. 网页内容抓取

:::

### `ubrowser.goto(url[, headers][, timeout])`

打开一个 ubrowser 窗口，并跳转到指定网页

#### 类型定义

```ts
function goto(
  url: string,
  headers?: Record<string, string>,
  timeout?: number
): UBrowser;
```

- `url`: 要跳转的网页地址
- `headers`: 请求头
- `timeout`: 超时时间，单位毫秒

### `ubrowser.useragent(ua)`

设置用户代理（User-Agent）

#### 类型定义

```ts
function useragent(ua: string): UBrowser;
```

- `ua`: User-Agent 字符串

### `ubrowser.viewport(width, height)`

设置浏览器视窗大小

#### 类型定义

```ts
function viewport(width: number, height: number): UBrowser;
```

- `width`: 视窗宽度
- `height`: 视窗高度

### `ubrowser.hide()`

隐藏 ubrowser 窗口

#### 类型定义

```ts
function hide(): UBrowser;
```

### `ubrowser.show()`

显示 ubrowser 窗口

#### 类型定义

```ts
function show(): UBrowser;
```

## 网页操作

ubrowser 支持网页内容魔改，即在网页加载前对网页内容进行修改，例如添加自定义 CSS、JavaScript 等。

### `ubrowser.css(css)`

添加自定义 CSS

#### 类型定义

```ts
function css(css: string): UBrowser;
```

- `css`: 自定义 CSS

### `ubrowser.evaluate(func[, params])`

在网页中执行自定义 JS 代码

#### 类型定义

```ts
function evaluate(func: Function, params?: any[]): UBrowser;
```

- `func`: 网页内执行的 JS 函数，函数若有返回值，则会在 `run` Promise 结果返回
- `params`: 传递给`func`的参数

### `ubrowser.press(key[, modifiers])`

模拟键盘按键

#### 类型定义

```ts
function press(key: string, ...modifiers: string[]): UBrowser;
```

- `key`: 要模拟的按键
- `modifiers`: 要模拟的修饰键，一般为 `shift`、`ctrl`、`alt`、`meta`

### `ubrowser.click(selector)`

执行点击操作

#### 类型定义

```ts
function click(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.mousedown(selector)`

执行鼠标按下操作

#### 类型定义

```ts
function mousedown(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.mouseup(selector)`

执行鼠标抬起操作

#### 类型定义

```ts
function mouseup(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.file(selector, payload)`

对网页中的 input 元素设置文件

#### 类型定义

```ts
function file(selector: string, payload: string | string[] | Buffer): UBrowser;
```

- `selector` 元素必须是可选择文件的输入元素 `input[type=file]`
- `payload` 可以是文件路径、文件路径集合以及文件 Buffer

### `ubrowser.value(selector, payload)`

对网页中的 input 元素设置值

#### 类型定义

```ts
function value(selector: string, payload: string): UBrowser;
```

- `selector` 必须是 `input`、`textarea`、`select` 元素，使用 CSS 选择器或 XPath 选择器
- `payload` 将会设置到 `value` 属性上

### `ubrowser.check(selector, checked)`

执行勾选操作

#### 类型定义

```ts
function check(selector: string, checked: boolean): UBrowser;
```

- `selector` 必须是 `checkbox`、`radio` 元素，使用 CSS 选择器或 XPath 选择器
- `checked` 为 `true` 时，勾选，否则取消勾选

### `ubrowser.focus(selector)`

执行聚焦操作

#### 类型定义

```ts
function focus(selector: string): UBrowser;
```

- `selector`: CSS 选择器或 XPath 选择器

### `ubrowser.scroll(selector)`

执行滚动操作

#### 类型定义

```ts
function scroll(selector: string): UBrowser;
function scroll(y: number): UBrowser;
function scroll(x: number, y: number): UBrowser;
```

- `selector` 为 `string` 时，滚动到指定元素, 使用 CSS 选择器或 XPath 选择器
- `selector` 为 `number` 时，只有一个参数表示 y 轴，滚动到纵向指定位置。两个参数则表示 x 轴。
- 传递 `x` 和 `y`，滚动到指定位置

### `ubrowser.download(url[, savePath])`

执行下载操作

#### 类型定义

```ts
function download(url: string, savePath?: string): UBrowser;
function download(
  func: (...params: any[]) => string,
  savePath: string | null,
  ...params: any[]
): UBrowser;
```

- `url` 待下载的资源 URL
- `savePath` 指定下载路径，不传则下载到默认路径
- `func` 网页内执行的 JS 函数, 函数可返回资源 URL，再根据返回 URL 下载资源
- `params` 传递给 `func` 的参数

### `ubrowser.paste(text)`

先复制再执行粘贴操作

#### 类型定义

```ts
function paste(text: string): UBrowser;
```

- `text`: 要粘贴的内容，支持普通文本跟图像 Base64 Data URL

### `ubrowser.screenshot(target[, savePath])`

对网页进行截屏并保持到指定路径，将会保存成为 png 格式

#### 类型定义

```ts
function screenshot(target?: string | Rect, savePath?: string): UBrowser;
```

- 没有参数时，整个网页窗口截屏
- 当 `target` 为 `string` 时，`target` 为选择器。可以传入一个 `Rect` 对象，表示截取指定区域。
- `savePath` 保存路径，没有传递 `savePath` 的时，默认存储在临时目录。

::: details `Rect` 类型定义

```ts
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

:::

### `ubrowser.markdown([selector])`

将当前网页内容转换为 markdown

#### 类型定义

```ts
function markdown(selector?: string): UBrowser;
```

- `selector`: 可选，指定要转换的元素，使用 CSS 选择器或 XPath 选择器，不传递则转换整个网页内容

### `ubrowser.pdf(options[, savePath])`

将网页保存为 PDF

#### 类型定义

```ts
function pdf(options: PdfOptions, savePath?: string): UBrowser;
```

- `PdfOptions` 参考 [Electron `PrintToPDFOptions`](https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions)
  >
- `savePath` 保存路径，没有传递 `savePath` 的时，默认存储在临时目录。

### `ubrowser.device(options)`

模拟移动设备

#### 类型定义

```ts
function device(options: DeviceOptions): UBrowser;
```

- `options` 模拟设备信息

::: details `DeviceOptions` 类型定义

```ts
interface DeviceOptions {
  userAgent: string;
  size: {
    width: number;
    height: number;
  };
}
```

:::

### `ubrowser.wait(ms)`

执行等待操作

#### 类型定义

```ts
// 等待时间
function wait(ms: number): this;
// 等待元素出现
function wait(selector: string, timeout?: number): this;
// 等待函数返回 true
function wait(
  func: (...params: any[]) => boolean,
  timeout?: number,
  ...params: any[]
): this;
```

- `ms` 等待指定毫秒数
- `selector` 等待元素出现，使用 CSS 选择器或 XPath 选择器
- `timeout` 等待超时时间，默认为 60000 ms (60 秒)
- `func` 网页内执行的 JS 函数, 返回 `true` 等待结束
- `params` 传递给 `func` 的参数

### `ubrowser.when(selector)`

条件判断

#### 类型定义

```ts
// 判断存在元素
function when(selector: string): UBrowser;
// 判断函数结果
function when(func: (...params: any[]) => boolean, ...params: any[]): UBrowser;
```

- `selector` 判断是否存在元素，使用 CSS 选择器或 XPath 选择器
- `func` 网页内执行的 JS 函数, 判断函数返回的结果
- `params` 传递给 `func` 的参数

### `ubrowser.end()`

结束上一个 `when`

#### 类型定义

```ts
function end(): UBrowser;
```

### `ubrowser.devTools([mode])`

打开 ubrowser 开发者工具。

#### 类型定义

```ts
function devTools(mode?: string): void;
```

- `mode`: 可选值 'right' | 'bottom' | 'undocked' | 'detach' ，默认 'detach'

### `ubrowser.cookies([name])`

获取 ubrowser cookie

#### 类型定义

```ts
// 在当前 url 根据名称获取 cookie, 为空获取当前 url 全部 cookie
function cookies(name?: string): UBrowser;
// 根据条件获取 Cookie
function cookies(filter: CookieFilter): UBrowser;
```

- `name` cookie 名称
- `filter` 过滤对象

::: details `CookieFilter` 类型定义

```ts
interface CookieFilter {
  url?: string;
  name?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  session?: boolean;
  httpOnly?: boolean;
}
```

- `url` 检索与 url 相关的 cookie。 空意味着检索所有 URL 的 cookie 。
- `name` 按名称筛选 cookie。
- `domain` 检索与域名或者 domain 子域名匹配的 cookie。
- `path` 检索路径与 path 匹配的 cookie。
- `secure` 通过其 Secure 属性筛选 cookie。
- `session` 筛选出 session 内可用或持久性 cookie。
- `httpOnly` 通过其 httpOnly 属性筛选 cookie。

:::

### `ubrowser.setCookies`

设置 ubrowser 的 cookie

#### 类型定义

```ts
function setCookies(name: string, value: string): UBrowser;
function setCookies(cookies: { name: string; value: string }[]): UBrowser;
```

- `name` cookie 名称
- `value` cookie 值
- `cookies` cookie 名称和值对象的集合

### `ubrowser.removeCookies(name)`

删除 ubrowser 的 cookie

#### 类型定义

```ts
function removeCookies(name: string): UBrowser;
```

- `name` cookie 名称

### `ubrowser.clearCookies([url])`

清空 ubrowser 的 cookie 信息。

#### 类型定义

```ts
function clearCookies(url?: string): UBrowser;
```

- `url`: 根据 url 清除 cookie，`clearCookies` 在 `goto` 函数之前调用时 `url` 不能为空。在 `goto` 之后调用则清空当前 url 的 cookie

### `ubrowser.run()`

开始运行 ubrowser 实例，并返回执行结果

#### 类型定义

```ts
function run(
  ubrowserId?: number,
  options?: UBrowserOptions
): Promise<[...any, UBrowserInstance]>;
```

- `ubrowserId` 一般以下两种形式获取：
  - `ubrowser.run` 返回的 `UBrowserInstance` 的 `id` 属性（ubrowser 窗口仍在显示时）。
  - [`utools.getIdleUBrowser`](./manage.md#utools-getidleubrowsers) 返回的 `UBrowserInstance` 的 `id` 属性。
- `run` 返回将会返回一个包含数组的 Promise 对象，数组的最后一个元素是当前未关闭窗口的 UBrowser 实例，其余的元素则是运行过程中，其他 ubrowser 方法的返回值，比如`evaluate`、`cookies`等。

::: details `UBrowserOptions` 类型定义

```ts
interface UBrowserOptions {
  show?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  center?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  fullscreenable?: boolean;
  enableLargerThanScreen?: boolean;
  opacity?: number;
  frame?: boolean;
  closable?: boolean;
  focusable?: boolean;
  skipTaskbar?: boolean;
  backgroundColor?: string;
  hasShadow?: boolean;
  transparent?: boolean;
  titleBarStyle?: string;
  thickFrame?: boolean;
}
```

- `show`: 是否显示浏览器窗口
- `width`: 浏览器窗口宽度，默认`800`
- `height`: 浏览器窗口高度，默认`600`
- `x`: 浏览器窗口位置 x 坐标
- `y`: 浏览器窗口位置 y 坐标
- `center`: 浏览器窗口是否居中
- `minWidth`: 浏览器窗口最小宽度，默认`0`
- `minHeight`: 浏览器窗口最小高度，默认`0`
- `maxWidth`: 浏览器窗口最大宽度，默认无限制
- `maxHeight`: 浏览器窗口最大高度，默认无限制
- `resizable`: 浏览器窗口是否可缩放，默认`true`
- `movable`: 浏览器窗口是否可移动，默认`true`
- `minimizable`: 浏览器窗口是否可最小化，默认`true`
- `maximizable`: 浏览器窗口是否可最大化，默认`true`
- `alwaysOnTop`: 浏览器窗口是否置顶，默认`false`
- `fullscreen`: 浏览器窗口是否全屏，默认`false`
- `fullscreenable`: 浏览器窗口是否可全屏，默认`true`
- `enableLargerThanScreen`: 浏览器窗口是否可超出屏幕，默认`false`，仅在 macOS 下生效
- `opacity`: 浏览器窗口透明度，默认`1`，支持`0`-`1`之间的值，仅在 macOS 跟 Windows 下生效
- `frame`: 浏览器窗口是否有边框，默认`true`
- `closable`: 浏览器窗口是否可关闭，默认`true`
- `focusable`: 浏览器窗口是否可聚焦，默认`true`
- `skipTaskbar`: 浏览器窗口是否跳过任务栏，默认`false`
- `backgroundColor`: 浏览器窗口背景颜色，默认`#ffffff`
- `hasShadow`: 浏览器窗口是否有阴影，默认`false`
- `transparent`: 浏览器窗口是否透明，默认`false`
- `titleBarStyle`: 浏览器窗口标题栏样式，默认`default`，可选值`hidden`、`hiddenInset`、`customButtonsOnHover`
- `thickFrame`: 浏览器窗口边框是否加粗，默认`false`

:::

::: details `UBrowserInstance` 类型定义 {#ubrowser-instance}

```ts
interface UBrowserInstance {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
}
```

:::

### 示例代码

```js
const address = "福州烟台山";
// 在地图上显示地址位置
utools.ubrowser
  // 打开百度地图站点
  .goto("https://map.baidu.com")
  // 等待出现搜索框
  .wait("#sole-input")
  // 搜索框获得焦点
  .focus("#sole-input")
  // 地址搜索框输入地址
  .value("#sole-input", address)
  // 等待 300 毫秒
  .wait(300)
  // 按下回车
  .press("enter")
  // 开始运行
  .run({ width: 1200, height: 800 });
```

```js
const expressNo = "YT8933937901850";
// 快递 100 查询快递单号
utools.ubrowser
  // 打开快递 100
  .goto("https://www.kuaidi100.com/")
  // 等待输入框
  .wait("#input")
  // 滚动到合适位置
  .scroll(0, 450)
  // 输入快递单号
  .value("#input", expressNo)
  // 点击查询
  .click("#query")
  // 开始运行(窗口大小 1280x720)
  .run({ width: 1280, height: 720 });
```

```js
const image = "/path/to/test.png";
// 图片自动去背景
utools.ubrowser
  // 清空 cookies
  .clearCookies("https://www.remove.bg")
  // 前往站点
  .goto("https://www.remove.bg/zh/upload")
  // 等界面加载出现上传按钮
  .wait('//div[text() = "上传图片"]')
  // 粘贴图片
  .paste(image)
  // 处理中，等待出现下载按钮
  .wait('//div[text() = "下载"]')
  // 再等待 3 秒，等结果返回
  .wait(3000)
  // 下载图片
  .download(function () {
    document
      .evaluate(
        '//div[text() = "下载"]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      .singleNodeValue?.click();
  }, utools.getPath("downloads") + "/removebg_" + Date.now() + ".png")
  // 关闭窗口
  .hide()
  // 开始运行
  .run({ width: 880, height: 720 });
```

```js
const filePath = `/path/to/test.zip`;
// 发送文件到微信文件传输助手
utools.ubrowser
  .goto("https://filehelper.weixin.qq.com")
  // 等待扫码登录
  .wait("textarea")
  // 上传文件，自动发送
  .file("#btnFile", filePath)
  // 开始运行
  .run({ width: 720, Height: 680 });
```

```js
const text = `https://pan.baidu.com/s/1ekPm-ooS0uvVA_J7ZqVGDQ 提取码: kvr5`;
const matchs = text.match(
  /(https?:\/\/[a-z0-9-._~:/?=#]+)\s*(?:\(|（)?(?:提取密?码?|访问密?码|密码)\s*(?::|：)?\s*([a-z0-9]{4,6})/i
);
// 网盘自动提取
utools.ubrowser
  // 打开网盘地址
  .goto(matchs[1])
  // 等待页面加载完成出现 input 元素
  .wait("input")
  // 等待 500 ms
  .wait(500)
  // 让提取码输入框获得焦点
  .evaluate(function () {
    const inputDoms = Array.from(document.querySelectorAll("input"));
    const targetInput =
      inputDoms.find(
        (x) =>
          x.placeholder.includes("提取码") || x.placeholder.includes("访问码")
      ) || inputDoms[0];
    targetInput.focus();
  })
  // 粘贴提取码
  .paste(matchs[2])
  // 等待 300 ms
  .wait(300)
  // 回车
  .press("enter")
  .run({ width: 1280, height: 720 });
```


# 团队应用

提供团队版插件相关的接口，用来获取团队版管理配置的信息。

:::tip
团队应用 API 需要配合团队管理后台使用，请在团队后台创建对应应用后可以使用。（暂未开放第三方应用）
:::

## `utools.team.info()`

获取当前团队信息

### 类型定义

```ts
function info(): TeamInfo;
```

::: details `TeamInfo` 类型定义

```ts
interface TeamInfo {
  teamId: string;
  teamName: string;
  teamLogo: string;
  userId: string;
  userName: string;
  userAvatar: string;
}
```

#### 字段说明

- `teamId`
  - 团队 ID，创建团队时生成
- `teamName`
  - 团队名称，创建团队时填写
- `teamLogo`
  - 团队图标，返回图片的网络地址
- `userId`
  - 团队成员 ID，加入团队时生成
- `userName`
  - 团队成员名字，加入团队时填写
- `userAvatar`
  - 团队成员头像

:::

### 示例代码

```js
const { teamName } = utools.team.info();

console.log(`当前团队为：${teamName}`);
```

## `utools.team.preset(key)`

获取对应的团队配置，获取的配置需要在团队版，返回的数据为一个 JSON 对象

### 类型定义

```ts
function preset<T>(key: string): T | null;
```

### 示例代码

```js
// 读取配置
const configValue = utools.team.preset("config-key");
console.log(configValue);
```

## `utools.team.allPresets([keyStartsWith])`

获取当前团队下发的所有配置，支持接收一个 key 前缀或者 keys 来过滤

### 类型定义

```ts
function allPresets(keyStartsWith?: string): Promise<{ key: string; value: any }[]>;
function allPresets(keys: string[]): Promise<{ key: string; value: any }[]>;
```

### 示例代码

```js
// 获取 key 是 "config-" 开头的所有配置
const allPresets1 = utools.team.allPresets("config-");
// 获取 key 数组对应的配置
const allPresets2 = utools.team.allPresets(["config-key-1", "config-key-2"]);
// 获取所有配置
const allPresets3 = utools.team.allPresets();
```


# 用户付费

## `utools.isPurchasedUser()`

是否付费用户

### 类型定义

```ts
function isPurchasedUser(): boolean | string
```

- 返回 `false` 非付费用户，返回 `true` 永久授权用户(付费买断)，返回 "yyyy-mm-dd hh:mm:ss" 日期字符串表示授权用户到期时间

### 示例代码

```js
utools.onPluginEnter(({ type, code, payload }) => {
  const purchasedUser = utools.isPurchasedUser();
  if (purchasedUser) {
    // 已付费的合法用户，可使用插件应用完整功能
    // purchasedUser === true 永久授权(付费买断)
    // purchasedUser === "yyyy-mm-dd hh:mm:ss", 授权到期时间
  } else {
    // 打开付费
    utools.openPurchase({ goodsId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }, () => {
      console.log("付费成功");
    });
  }
});
```

## `utools.openPurchase(options, callback)`

打开付费 (适用软件付费模式)

::: warning 软件付费
软件付费指的是，用户按天数购买授权，在授权生效期内，可以使用对应的插件应用功能

付费模式
- 插件应用基础功能免费，高级功能付费使用（推荐）
- 插件应用完全收费
:::

### 类型定义

```ts
function openPurchase(options: OpenPurchaseOptions, callback?: () => void): void
```

::: details `OpenPurchaseOptions` 类型定义

```ts
interface OpenPurchaseOptions {
  goodsId: string;
  outOrderId?: string;
  attach?: string;
}
```

#### 字段说明

- `goodsId`
  - 商品 ID，在 “ uTools 开发者工具” 插件应用中创建
- `outOrderId`
  - 第三方服务生成的订单号（6 - 64 字符）
- `attach`
  - 第三方服务附加数据，在查询 API 和支付通知中原样返回，可作为自定义参数使用（最多 256 字符）

:::

- `options` 付费参数
- `callback` 付费成功执行的回调函数

### 示例代码

```js
utools.onPluginEnter(({ type, code, payload }) => {
  const purchasedUser = utools.isPurchasedUser();
  if (purchasedUser) {
    // 已付费的合法用户，可使用插件应用完整功能
    // purchasedUser === true 永久授权(付费买断)
    // purchasedUser === "yyyy-mm-dd hh:mm:ss", 授权到期时间
  } else {
    // 打开付费
    utools.openPurchase({ goodsId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }, () => {
      console.log("付费成功");
    });
  }
});
```

## `utools.openPayment(options, callback)`

打开支付 (适用服务付费模式)

::: warning 服务付费
服务付费指的是，用户按使用量购买应用服务，在购买后，可以在固定的次数或者数量下，使用应用服务。

付费模式
- 服务 API 按次/按量购买。
- 售卖虚拟商品。
:::

### 类型定义

```ts
function openPayment(options: OpenPaymentOptions, callback?: () => void): void
```

::: details `OpenPaymentOptions` 类型定义

```ts
interface OpenPaymentOptions {
  goodsId: string;
  outOrderId?: string;
  attach?: string;
}
```

#### 字段说明

- `goodsId`
  - 商品 ID，在 “ uTools 开发者工具” 插件应用中创建
- `outOrderId`
  - 第三方服务生成的订单号（6 - 64 字符）
- `attach`
  - 第三方服务附加数据，在查询 API 和支付通知中原样返回，可作为自定义参数使用（最多 256 字符）

:::

- `options` 支付参数
- `callback` 支付成功执行的回调函数

### 示例代码

```js
// 1. 配置好服务端支付通知地址
// 2. 打开支付
utools.openPayment({ goodsId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }, () => {
  console.log("支付成功");
  // 重新从服务器获取已购买商品量
});
```

## `utools.fetchUserPayments()`

获取用户支付记录

### 类型定义

```ts
function fetchUserPayments(): Promise<Payment[]>
```

::: details `Payment` 类型定义

```ts
interface Payment {
  order_id: string;
  out_order_id: string;
  open_id: string;
  pay_fee: number;
  body: string;
  attach: string;
  goods_id: string;
  paid_at: string;
  created_at: string;
}
```

#### 字段说明

- `order_id`
  - uTools 订单 ID
- `out_order_id`
  - 外部或第三方服务生成的订单号
- `open_id`
  - uTools 用户 ID
- `pay_fee`
  - 支付金额，单位为分
- `body`
  - 商品描述
- `attach`
  - 附加数据
- `goods_id`
  - 商品 ID
- `paid_at`
  - 支付时间
- `created_at`
  - 订单生成时间

:::

### 示例代码

```js
utools.fetchUserPayments().then((payments) => {
  console.log(payments);
});
```


# 服务端 API

通过 uTools 的服务端 API，可以将你的应用和 uTools 用户关联，实现帐号互通、接收支付通知、查询用户支付记录等，为保护密钥安全，请仅在服务端调用接口。

## 公共定义

### 返回状态码

| 状态码 | 说明                         |
| ------ | ---------------------------- |
| 200    | 成功                         |
| 400    | 客户端错误                   |
| 401    | 位置用户（sign 错误）        |
| 403    | 无权限访问（timestamp 过期） |
| 404    | 未找到对应插件               |
| 422    | 请求参数校验失败             |
| 500    | uTools 暂时无法提供服务      |

## 获取用户基础信息

此接口用于获取 uTools 用户的基础信息、验证用户真实性，与第三方系统进行帐号打通，实现系统间免登录跳转等。

### 接口定义

```http
GET https://open.u-tools.cn/baseinfo
Accept: application/json
```

### 请求参数

| 参数名       | 类型   | 必填 | 说明                                            |
| ------------ | ------ | ---- | ----------------------------------------------- |
| plugin_id    | string | 是   | 插件 ID                                         |
| access_token | string | 是   | 用户登录凭证，[点击查看获取方式](#access_token) |
| timestamp    | string | 是   | 请求时间戳(秒)，误差需小于 10 分钟              |
| sign         | string | 是   | 签名，详见[签名算法](#sign_method)              |

### 响应数据

- 状态`200`时返回

```json
{
  "resource": {
    "avatar": "https://res.u-tools.cn/assets/avatars/eZCBIawAkspLw8Xg.png",
    "member": 1, // 是否 uTools 会员（0: 否，1: 是）
    "nickname": "却步.",
    "open_id": "00a50cd81c37c4e381e8161b2d762158", // uTools 用户 ID, 对于此插件应用不变且唯一
    "timestamp": 1624329616
  },
  "sign": "4dbf21a9d5a0f0e3906a0180522fd6393b4e91f738d57cafddf309afc6c547bb" // 签名算法与 1.3 相同
}
```

- 其他状态时返回

```json
{
  "message": "The given data was invalid.", // message 字段始终存在
  "errors": {
    // 可能没有详细错误信息
    "access_token": ["access token 必须是 32 个字符。"]
  }
}
```

### 调用步骤

1. 在客户端获取用户登录凭证 access_token，[通过`utools.fetchUserServerTemporaryToken`获取](./utools/user.md#utools-fetchuserservertemporarytoken) {#access_token}

2. 服务端签名算法 {#sign_method}

- 对请求参数按参数名升序排序
- 对参数内容进行 `url_encode` 编码后，组合成 URL 参数形式的字符串，如：`access_token=aaaaaaa&plugin_id=ccccc&timestamp=1624329435`
- 使用 HMAC 方法对字符串生成带有密钥的哈希值，得到签名

::: code-group

```php
$params = [
  "plugin_id" => "zueadppw", // 可在开发者插件应用中获得
  "access_token" => "user access_token 32位",
  "timestamp" => "1624329435",
];
// 1. 按照键名对数组进行升序排序
ksort($params);
// 2. 生成 URL-encode 之后的请求字符串
$str = http_build_query($params);
// 3. 使用 HMAC 方法生成带有密钥的哈希值
$secret = "your secret 32位"; // secret 在开发者插件应用中通过重置获取
$sign = hash_hmac("sha256", $str, $secret);
```

```js [nodejs]
const crypto = require("crypto");
const params = {
  plugin_id: "zueadppw", // 可在开发者插件应用中获得
  access_token: "user access_token 32位",
  timestamp: "1624329435",
};
// 1. 按照键名对数组进行升序排序
const keys = Object.keys(params).sort();
const sortedParams = keys.reduce((acc, key) => {
  acc[key] = params[key];
  return acc;
}, {});
// 2. 生成 URL-encode 之后的请求字符串
const str = new URLSearchParams(sortedParams).toString();
// 3. 使用 HMAC 方法生成带有密钥的哈希值
const secret = "your secret 32位"; // secret 在开发者插件应用中通过重置获取
const sign = crypto.createHmac("sha256", secret).update(str).digest("hex");
```

:::

3. 发起请求

::: code-group

```bash [curl]
curl --location --request GET 'https://open.u-tools.cn/baseinfo' \
--header 'Content-Type: application/json' \
--data-raw '{
  "plugin_id": "zueadppw", // 可在开发者插件应用中获得
  "access_token": "user access_token 32位",
  "timestamp": "1624329435",
  "sign": "xxx"
  }'
```

```php
$ch = curl_init();
$url = "https://open.u-tools.cn/baseinfo?" . http_build_query($params);
$headers = array(
  "Content-Type: application/json",
  "Accept: application/json",
)
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
if (!curl_errno($ch)) {
  $json = json_decode($response, true);
  echo $json;
}
curl_close($ch);
```

```js [nodejs]
const fetch = require('node-fetch')
const params = {
  plugin_id: "zueadppw", // 可在开发者插件应用中获得
  access_token: "user access_token 32位",
  timestamp: "1624329435",
  sign: "xxx"
}
fetch('https://open.u-tools.cn/baseinfo?' + new URLSearchParams(params), {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
).then(res => res.json()).then(data => {
  console.log(data)
})
```

:::

## 支付订单查询接口

此接口用于主动查询订单支付状态。

### 接口定义

```http
GET https://open.u-tools.cn/payments/record
Accept: application/json
```

### 请求参数

| 参数名       | 类型   | 必填 | 说明                               |
| ------------ | ------ | ---- | ---------------------------------- |
| plugin_id    | string | 是   | 插件 ID                            |
| out_order_id | string | 是   | 传 out_order_id 或 order_id 均可 |
| timestamp    | int    | 是   | 时间戳（秒），误差需小于 10 分钟   |
| sign         | string | 是   | 签名，详见[签名算法](#sign_method) |

### 响应数据

- 状态`200`时返回

```json
{
  "resource": {
    "attach": "", // 附加数据
    "body": "会员1年", // 支付内容
    "created_at": "2021-06-18 16:42:16", // 订单生成时间
    "goods_id": "6n193s7P95p9gA13786YkwQ5oxHpVW4f", // 商品ID
    "open_id": "a331127d654761ac91d086b942aae7b6", // uTools 用户 ID
    "order_id": "KMFSOZt5cMe5A0ClkdCAAyPasyXZJzP6", // uTools 订单号
    "out_order_id": "123456", // 外部订单号
    "paid_at": "", // 用户支付时间
    "pay_fee": 1, // 支付金额（分）
    "plugin_id": "FFFFFFFF",
    "status": 0, // 是否支付（0: 未支付，10: 已支付）
    "timestamp": 1624346603 // 请求发送时间戳
  },
  "sign": "dbb3d05f6e794ca3b2bc2fa7ef45c3f7cd6a3b20c601b37317863b67998d535e"
}
```

## 创建商品接口

此接口用于动态创建商品，主要解决不固定金额商品问题，一般为一次性使用，通过此 API 创建的商品不会出现在开发者工具的商品列表中

### 接口定义

```http
POST https://open.u-tools.cn/goods
Accept: application/json
```

### 请求参数

| 参数名       | 类型   | 必填 | 说明                                            |
| ------------ | ------ | ---- | ----------------------------------------------- |
| plugin_id    | string | 是   | 插件 ID                                         |
| access_token | string | 是   | 用户登录凭证，[点击查看获取方式](#access_token) |
| timestamp    | int    | 是   | 时间戳（秒），误差需小于 10 分钟                |
| sign         | string | 是   | 签名，[点击查看签名方式](#sign)                 |

### 响应数据

```json
{
  "message": "ZyxrbSpWBH360pSWG0ueYI3rKSWXMcic"
}
```

## 用户支付成功回调接口

当用户通过 uTools 在你的插件应用内完成支付，且在开发者工具中配置了回调地址，在收到付款时，会将信息推送到配置的回调地址。

### 接口定义

此处的接口定义指的是开发者工具中配置的回调地址，将会以 `POST` 方式推送数据到开发者工具中配置的回调地址。

```http
POST /<*api_path>
Content-Type: application/json
```

### 请求参数

此处的请求参数指的是将对开发者工具中配置的回调地址发起 `POST` 请求时，会被携带的参数。

```json
{
  "resource": {
    "attach": "", // 附加数据
    "body": "支付内容", // 支付内容
    "created_at": "2021-06-18 16:42:16", // 订单生成时间
    "goods_id": "xxx", // 商品ID
    "open_id": "xxx", // uTools 用户 ID
    "order_id": "xxx", // uTools 订单号
    "out_order_id": "123456", // 外部订单号
    "paid_at": "2021-06-18 16:42:36", // 用户支付时间
    "pay_fee": 1, // 支付金额（分）
    "plugin_id": "FFFFFFFF",
    "status": 10, // 是否支付（0: 未支付，10: 已支付）
    "timestamp": 1624346603 // 请求发送时间戳
  },
  "sign": "xxx"
}
```

::: warning 注意事项

1. 当处理完成后，请返回字符串 SUCCESS
2. 如果返回值为其他，uTools 会延时后再次通知，最多通知 5 次，时间间隔 [15, 30, 60, 300, 600] 秒。
3. 通知最长等待 10 秒。
4. 避免消息伪造，请务必验证 sign，签名方式与获取用户基础信息接口 1.3 一致

:::
