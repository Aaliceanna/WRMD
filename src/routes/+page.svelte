<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, keymap } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown } from "@codemirror/lang-markdown";
  import { typoraTheme } from "$lib/editor/typora-theme";
  import { createLivePreviewPlugin } from "$lib/editor/live-preview";
  import TitleBar from "$lib/components/TitleBar.svelte";
  import Outline, { type HeadingItem } from "$lib/components/Outline.svelte";
  import CommandPalette, { type CommandAction } from "$lib/components/CommandPalette.svelte";

  // 编辑器 DOM 容器与实例
  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;

  // 状态变量
  let fileName: string = "Untitled.md";
  let filePath: string | null = null;
  let isDirty: boolean = false;
  let isLivePreview: boolean = true;
  let isOutlineOpen: boolean = false;
  let isPaletteOpen: boolean = false;
  let wordCount: number = 0;
  let charCount: number = 0;
  let headings: HeadingItem[] = [];

  // CodeMirror Compartment 动态插拔
  const livePreviewCompartment = new Compartment();

  // 检查是否在 Tauri 原生环境
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  async function invokeNative(cmd: string, args: Record<string, any> = {}) {
    if (!isTauri) return null;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke(cmd, args);
    } catch (err) {
      console.warn(`[Tauri Invoke Error] ${cmd}:`, err);
      return null;
    }
  }

  // 默认欢迎文档
  const defaultDoc = `# 欢迎使用 WRMD

一款对标 **Typora** 体验、极致追求性能与轻量化的 Markdown 独立桌面软件。

## 核心特性
- **就地排版 (Live Preview)**：单画布无界体验，光标移出即时渲染，光标移入恢复源码语法。
- **数据零格式污染**：底层存储始终为 100% 原始 Markdown 纯文本。
- **极速轻巧**：冷启动毫秒级响应，虚拟滚动承载数十万字不卡顿。
- **数据安全保障**：支持失去焦点自动保存与原子写入（Atomic Write）。
- **上次文件记忆**：下次启动软件时，优先自动恢复上次编辑的文件。

## 常用快捷键
- **Ctrl + S** : 立即保存当前文档
- **Ctrl + O** : 打开本地 Markdown 文件
- **Ctrl + P** : 唤起全局命令面板
- **Ctrl + /** : 一键切换就地排版 / 纯源码模式
- **Ctrl + B** : 加粗选中文本 (**Bold**)
- **Ctrl + I** : 斜体选中文本 (*Italic*)
- **Ctrl + K** : 插入 Markdown 链接
- **Ctrl + Shift + D** : 插入精确时间戳
- **Ctrl + Shift + O** : 展开/收起目录大纲

## 待办清单
- [x] 完成 Phase 0 工具链配置
- [x] 完成 Phase 1 骨架搭建
- [x] 完成 Phase 2 原生原子安全 I/O
- [x] 记住上次打开的文件
- [ ] 享受极致沉浸的书写体验

---
> *开始书写你的灵感吧...*
`;

  // 解析文档大纲
  function updateHeadings(docText: string) {
    const lines = docText.split("\n");
    const result: HeadingItem[] = [];
    let curPos = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        result.push({
          level: match[1].length,
          text: match[2].trim(),
          line: i + 1,
          pos: curPos
        });
      }
      curPos += line.length + 1;
    }
    headings = result;
  }

  // 统计字数
  function updateStats(text: string) {
    charCount = text.length;
    const words = text.trim().match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_-]+/g);
    wordCount = words ? words.length : 0;
  }

  // 点击大纲项跳转
  function handleSelectHeading(item: HeadingItem) {
    if (!view) return;
    view.dispatch({
      selection: { anchor: item.pos },
      scrollIntoView: true
    });
    view.focus();
  }

  // 切换就地渲染 / 纯源码模式
  function toggleLivePreview() {
    isLivePreview = !isLivePreview;
    if (view) {
      view.dispatch({
        effects: livePreviewCompartment.reconfigure(
          createLivePreviewPlugin(() => isLivePreview)
        )
      });
      view.focus();
    }
  }

  // 新建文件
  function handleNewFile() {
    if (isDirty && !confirm("当前文件有未保存更改，是否继续新建？")) {
      return;
    }
    fileName = "Untitled.md";
    filePath = null;
    isDirty = false;
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: "" }
      });
      view.focus();
    }
  }

  // 系统原生"打开文件"对话框
  async function pickOpenPath(): Promise<string | null> {
    if (!isTauri) return null;
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const sel = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "txt"] }]
      });
      return typeof sel === "string" ? sel : null;
    } catch (e) {
      console.warn("打开文件对话框失败:", e);
      return null;
    }
  }

  // 系统原生"保存文件"对话框
  async function pickSavePath(defaultName: string): Promise<string | null> {
    if (!isTauri) return null;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      return await save({
        defaultPath: defaultName,
        filters: [{ name: "Markdown", extensions: ["md"] }]
      });
    } catch (e) {
      console.warn("保存文件对话框失败:", e);
      return null;
    }
  }

  // 记录最后打开的文件路径（双重持久化：Rust 后端 + 本地存储）
  function recordLastFile(path: string) {
    if (!path) return;
    invokeNative("set_last_file", { path });
    try {
      localStorage.setItem("wrmd_last_file", path);
    } catch (e) {}
  }

  // 保存文件
  async function handleSaveFile() {
    if (!view) return;
    const content = view.state.doc.toString();

    // 如果还没有指定文件路径，唤起系统原生另存为窗口
    if (!filePath) {
      const target = await pickSavePath(fileName);
      if (!target) return;
      filePath = target;
      fileName = target.split(/[\\/]/).pop() || "Untitled.md";
    }

    try {
      await invokeNative("write_file_atomic", { path: filePath, content });
      isDirty = false;
      recordLastFile(filePath);
    } catch (err) {
      alert(`保存失败: ${err}`);
    }
  }

  // 打开文件
  async function handleOpenFile() {
    const target = await pickOpenPath();
    if (!target) return;
    await loadFile(target);
  }

  // 加载指定路径文件
  async function loadFile(path: string) {
    try {
      const content = await invokeNative("read_file", { path });
      if (typeof content === "string" && view) {
        filePath = path;
        fileName = path.split(/[\\/]/).pop() || "Untitled.md";
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content }
        });
        isDirty = false;
        recordLastFile(path);
      }
    } catch (err) {
      console.warn(`无法读取文件 ${path}:`, err);
    }
  }

  // 插入当前时间戳 (Ctrl+Shift+D)
  function insertTimestamp() {
    if (!view) return;
    const now = new Date();
    const ts = now.toISOString().replace("T", " ").substring(0, 19);
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: ts },
      selection: { anchor: from + ts.length }
    });
    view.focus();
  }

  // 快捷格式化包裹
  function wrapSelection(prefix: string, suffix: string = prefix) {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    view.dispatch({
      changes: { from, to, insert: `${prefix}${selected}${suffix}` },
      selection: { anchor: from + prefix.length, head: to + prefix.length }
    });
    view.focus();
  }

  // 初始化 CodeMirror 6
  onMount(async () => {
    const livePlugin = createLivePreviewPlugin(() => isLivePreview);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        isDirty = true;
        const text = update.state.doc.toString();
        updateHeadings(text);
        updateStats(text);
      }
    });

    const customShortcuts = keymap.of([
      { key: "Mod-s", run: () => { handleSaveFile(); return true; } },
      { key: "Mod-o", run: () => { handleOpenFile(); return true; } },
      { key: "Mod-n", run: () => { handleNewFile(); return true; } },
      { key: "Mod-p", run: () => { isPaletteOpen = true; return true; } },
      { key: "Mod-/", run: () => { toggleLivePreview(); return true; } },
      { key: "Mod-Shift-o", run: () => { isOutlineOpen = !isOutlineOpen; return true; } },
      { key: "Mod-b", run: () => { wrapSelection("**"); return true; } },
      { key: "Mod-i", run: () => { wrapSelection("*"); return true; } },
      { key: "Mod-k", run: () => { wrapSelection("[", "](url)"); return true; } },
      { key: "Mod-Shift-d", run: () => { insertTimestamp(); return true; } },
    ]);

    const state = EditorState.create({
      doc: defaultDoc,
      extensions: [
        history(),
        markdown(),
        typoraTheme,
        livePreviewCompartment.of(livePlugin),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        customShortcuts,
        updateListener,
      ]
    });

    view = new EditorView({
      state,
      parent: editorContainer
    });

    updateHeadings(defaultDoc);
    updateStats(defaultDoc);

    // 文件打开优先级检查：
    // 1. 优先检查外部双击或命令行传入的文件路径
    // 2. 次选恢复上次打开的历史文件 (Rust 配置文件)
    // 3. 再次选检查浏览器端存储的备用路径
    // 4. 若无则保持当前默认欢迎页
    let loaded = false;

    if (isTauri) {
      const cliFile = await invokeNative("get_cli_target_file");
      if (cliFile && typeof cliFile === "string") {
        await loadFile(cliFile);
        loaded = true;
      }

      if (!loaded) {
        const lastFile = await invokeNative("get_last_file");
        if (lastFile && typeof lastFile === "string") {
          await loadFile(lastFile);
          loaded = true;
        }
      }
    }

    if (!loaded) {
      try {
        const localLast = localStorage.getItem("wrmd_last_file");
        if (localLast && typeof localLast === "string") {
          await loadFile(localLast);
        }
      } catch (e) {}
    }

    // 监听失焦自动保存当前文件
    window.addEventListener("blur", () => {
      if (filePath && isDirty) {
        handleSaveFile();
      }
    });
  });

  onDestroy(() => {
    view?.destroy();
  });

  // 命令面板操作定义
  const commandActions: CommandAction[] = [
    { id: "save", title: "保存文件", shortcut: "Ctrl+S", action: handleSaveFile },
    { id: "open", title: "打开文件...", shortcut: "Ctrl+O", action: handleOpenFile },
    { id: "new", title: "新建文档", shortcut: "Ctrl+N", action: handleNewFile },
    { id: "toggle-preview", title: "切换就地排版 / 源码模式", shortcut: "Ctrl+/", action: toggleLivePreview },
    { id: "toggle-outline", title: "显示 / 隐藏目录大纲", shortcut: "Ctrl+Shift+O", action: () => (isOutlineOpen = !isOutlineOpen) },
    { id: "bold", title: "粗体 (Bold)", shortcut: "Ctrl+B", action: () => wrapSelection("**") },
    { id: "italic", title: "斜体 (Italic)", shortcut: "Ctrl+I", action: () => wrapSelection("*") },
    { id: "link", title: "插入链接", shortcut: "Ctrl+K", action: () => wrapSelection("[", "](url)") },
    { id: "timestamp", title: "插入当前时间戳", shortcut: "Ctrl+Shift+D", action: insertTimestamp },
    { id: "copy-all", title: "复制全文到剪贴板", action: () => {
      if (view) navigator.clipboard.writeText(view.state.doc.toString());
    }},
    { id: "clear", title: "清空当前内容", action: () => {
      if (view && confirm("确定清空全部内容吗？")) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } });
      }
    }}
  ];
</script>

<svelte:window on:keydown={(e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
    e.preventDefault();
    isPaletteOpen = true;
  }
}} />

<div class="app-root">
  <TitleBar
    {fileName}
    {filePath}
    {isDirty}
    {isLivePreview}
    {wordCount}
    {charCount}
    {isOutlineOpen}
    onToggleOutline={() => (isOutlineOpen = !isOutlineOpen)}
    onToggleLivePreview={toggleLivePreview}
    onNewFile={handleNewFile}
    onOpenFile={handleOpenFile}
    onSaveFile={handleSaveFile}
  />

  <div class="workspace">
    <Outline
      isOpen={isOutlineOpen}
      {headings}
      onSelectHeading={handleSelectHeading}
      onClose={() => (isOutlineOpen = false)}
    />

    <main class="editor-viewport" bind:this={editorContainer}></main>
  </div>

  <CommandPalette
    isOpen={isPaletteOpen}
    actions={commandActions}
    onClose={() => (isPaletteOpen = false)}
  />
</div>

<style>
  :global(body, html) {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
  }

  .app-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .workspace {
    display: flex;
    flex: 1;
    height: calc(100vh - 38px);
    overflow: hidden;
    position: relative;
  }

  .editor-viewport {
    flex: 1;
    height: 100%;
    overflow-y: auto;
    background: #ffffff;
  }

  :global(.cm-editor) {
    height: 100%;
  }

  :global(.cm-scroller) {
    overflow: auto;
    font-family: inherit;
  }
</style>