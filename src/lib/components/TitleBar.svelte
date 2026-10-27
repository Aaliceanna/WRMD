<script lang="ts">
  export let fileName: string = "Untitled.md";
  export let filePath: string | null = null;
  export let isDirty: boolean = false;
  export let isLivePreview: boolean = true;
  export let wordCount: number = 0;
  export let charCount: number = 0;
  export let isOutlineOpen: boolean = false;
  export let onToggleOutline: () => void = () => {};
  export let onToggleLivePreview: () => void = () => {};
  export let onNewFile: () => void = () => {};
  export let onOpenFile: () => void = () => {};
  export let onSaveFile: () => void = () => {};

  // 跨平台快捷键适配：Mac 显示 ⌘，Windows/Linux 显示 Ctrl+
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl+";
</script>

<header class="titlebar" data-tauri-drag-region>
  <div class="left-section">
    <button
      class="icon-btn"
      class:active={isOutlineOpen}
      title="切换大纲 ({mod}Shift+O)"
      on:click={onToggleOutline}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="15" y2="12"></line>
        <line x1="3" y1="18" x2="18" y2="18"></line>
      </svg>
    </button>
    <button class="icon-btn" title="新建文件 ({mod}N)" on:click={onNewFile}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
    </button>
    <button class="icon-btn" title="打开文件 ({mod}O)" on:click={onOpenFile}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
    <button class="icon-btn" title="保存文件 ({mod}S)" on:click={onSaveFile}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
    </button>
  </div>

  <div class="center-section" title={filePath || fileName}>
    <span class="file-name">{fileName}</span>
    {#if isDirty}
      <span class="dirty-indicator" title="未保存更改">●</span>
    {/if}
  </div>

  <div class="right-section">
    <div class="stat-badge" title="字符数 / 字数">
      <span>{wordCount} 词</span>
      <span class="divider">/</span>
      <span>{charCount} 字符</span>
    </div>
    <button
      class="mode-badge"
      class:active={isLivePreview}
      title="切换就地渲染/纯源码模式 ({mod}/)"
      on:click={onToggleLivePreview}
    >
      {isLivePreview ? "就地排版" : "纯源码"}
    </button>
  </div>
</header>

<style>
  .titlebar {
    height: 38px;
    background: #fbfbfd;
    border-bottom: 1px solid #e5e5ea;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    user-select: none;
    font-size: 13px;
    color: #48484a;
  }
  .left-section, .right-section {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .center-section {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    color: #1d1d1f;
  }
  .dirty-indicator {
    color: #ff9500;
    font-size: 10px;
  }
  .icon-btn {
    background: transparent;
    border: none;
    padding: 4px 6px;
    border-radius: 4px;
    color: #636366;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  .icon-btn:hover {
    background: #e5e5ea;
    color: #1d1d1f;
  }
  .icon-btn.active {
    background: #007aff15;
    color: #007aff;
  }
  .stat-badge {
    font-size: 11px;
    color: #8e8e93;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
  }
  .stat-badge .divider {
    color: #c7c7cc;
  }
  .mode-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid #d1d1d6;
    background: #ffffff;
    color: #636366;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mode-badge:hover {
    border-color: #007aff;
    color: #007aff;
  }
  .mode-badge.active {
    background: #007aff;
    color: #ffffff;
    border-color: #007aff;
  }
</style>