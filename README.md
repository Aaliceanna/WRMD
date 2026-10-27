# WRMD (Write Markdown)

<p align="center">
  <b>A Lightweight, High-Performance Typora-Style Markdown Desktop Editor</b><br>
  一款对标 Typora 体验、极致追求轻量与读写效率的 Markdown 独立桌面软件
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release_Size-4.4MB-brightgreen" alt="Size">
  <img src="https://img.shields.io/badge/Startup-<250ms-blue" alt="Startup">
  <img src="https://img.shields.io/badge/Architecture-Tauri_v2_+_Rust_+_Svelte_5-orange" alt="Tech">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 🌟 核心特性 (Key Features)

- **🎨 Typora 式就地排版 (Live Preview)**
  单画布无界排版体验。光标所在行保持原生 Markdown 语法符号方便精准修改；光标移开后瞬时折叠语法符号，呈现清晰优雅的排版效果。
- **🛡️ 纯文本零格式污染**
  放弃破坏性的富文本 AST 转换方案，底层存储始终为 **100% 原始 Markdown 纯文本**，绝不擅自篡改你的空格、缩进与换行。
- **⚡ 极致轻量与启动响应**
  单文件绿色版体积仅 **4.4 MB**，安装包仅 **1.5 MB**（相较传统 Electron 动辄 100MB+ 体积瘦身 90% 以上）。首屏毫秒级冷启动。
- **💾 原生原子安全 I/O (Atomic Write)**
  写入时先落盘至校验临时文件，再执行原子重命名覆盖，杜绝意外断电或程序崩溃导致原文档变空。支持失去焦点自动保存（Auto-save on blur）。
- **📌 历史会话无缝记忆**
  自动持久化记录最近编辑的文件。下次启动软件时，优先自动恢复上次编辑的文件与大纲状态。
- **🗂️ 毫秒级目录大纲**
  内置抽屉式大纲视图，毫秒级提取文档中的各级标题树，支持悬浮展示与点击平滑定位跳转。
- **⌨️ 键盘优先驱动 (Keyboard-First)**
  提供全局命令面板 (`Ctrl+P`) 与丰富的 Markdown 快捷按键体系，双手无需离开键盘。

---

## ⌨️ 快捷键速查表 (Keyboard Shortcuts)

| 快捷键 | 动作说明 |
| :--- | :--- |
| **`Ctrl + S`** | 保存当前文件（原子写入防丢） |
| **`Ctrl + O`** | 唤起系统原生文件选择器打开文档 |
| **`Ctrl + N`** | 新建空白 Markdown 文档 |
| **`Ctrl + P`** | 呼出全局命令面板（模糊搜索与操作执行） |
| **`Ctrl + /`** | 一键切换就地排版 / 极客纯源码模式 |
| **`Ctrl + Shift + O`** | 展开 / 收起实时目录大纲抽屉 |
| **`Ctrl + B`** | 粗体选中文本 (`**加粗**`) |
| **`Ctrl + I`** | 斜体选中文本 (`*斜体*`) |
| **`Ctrl + K`** | 插入超链接 (`[链接文本](url)`) |
| **`Ctrl + Shift + D`** | 插入当前精确时间戳 (`YYYY-MM-DD HH:mm:ss`) |

---

## 🛠️ 技术架构 (Technology Stack)

```
┌────────────────────────────────────────────────────────┐
│                   前端 UI (Svelte 5)                   │
│   CodeMirror 6 虚拟滚动画布 + Range Decoration 排版引擎 │
│           气泡工具栏 + 目录大纲抽屉 + 命令面板            │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (零开销原生通道)
┌───────────────────────────▼────────────────────────────┐
│                  Rust 原生核心层 (Native)               │
│      极速 I/O 引擎 + 原子写入 + 命令行/双击关联捕获        │
│                系统级配置持久化 (last_file)             │
└────────────────────────────────────────────────────────┘
```

- **Native Host**: [Tauri v2](https://v2.tauri.app/) + [Rust](https://www.rust-lang.org/)
- **UI Framework**: [Svelte 5](https://svelte.dev/) + TypeScript
- **Editor Engine**: [CodeMirror 6](https://codemirror.net/) (按需模块化，虚拟视口渲染)
- **Styling**: 精调 Typora 经典排版主题 (Vanilla CSS, 零外部厚重 CSS 框架)

---

## 🚀 本地开发与构建 (Getting Started)

### 环境依赖
- [Node.js](https://nodejs.org/) (推荐 LTS 20+)
- [Rust](https://rustup.rs/) (Stable toolchain)
- Windows SDK / Visual Studio C++ 构建工具 (Windows 平台)

### 安装与运行
```bash
# 1. 克隆代码仓库
git clone https://github.com/Aaliceanna/WRMD.git
cd WRMD

# 2. 安装前端依赖
npm install

# 3. 启动本地开发环境
npm run tauri dev
```

### 生产打包
```bash
# 生成独立可执行程序 (exe)
npm run tauri build -- --no-bundle

# 生成 Windows 安装向导包 (NSIS / MSI)
npm run tauri build
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。