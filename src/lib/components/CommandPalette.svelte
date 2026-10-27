<script lang="ts">
  import { onMount, tick } from "svelte";

  export interface CommandAction {
    id: string;
    title: string;
    shortcut?: string;
    action: () => void;
  }

  export let isOpen: boolean = false;
  export let actions: CommandAction[] = [];
  export let onClose: () => void = () => {};

  let query: string = "";
  let selectedIndex: number = 0;
  let inputElement: HTMLInputElement;

  $: filteredActions = actions.filter((act) =>
    act.title.toLowerCase().includes(query.toLowerCase())
  );

  $: if (filteredActions.length > 0 && selectedIndex >= filteredActions.length) {
    selectedIndex = 0;
  }

  export async function open() {
    isOpen = true;
    query = "";
    selectedIndex = 0;
    await tick();
    inputElement?.focus();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredActions.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredActions.length) % filteredActions.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
        onClose();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
  <div class="palette-backdrop" on:click={onClose}>
    <div class="palette-modal" on:click|stopPropagation>
      <div class="input-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          bind:this={inputElement}
          bind:value={query}
          type="text"
          placeholder="键入命令以搜索 (如: 保存, 源码, 新建)..."
        />
        <span class="esc-hint">ESC 退出</span>
      </div>

      <div class="action-list">
        {#if filteredActions.length === 0}
          <div class="empty-tip">未找到匹配的命令</div>
        {:else}
          {#each filteredActions as item, i}
            <div
              class="action-item"
              class:selected={i === selectedIndex}
              on:mouseenter={() => (selectedIndex = i)}
              on:click={() => { item.action(); onClose(); }}
            >
              <span class="item-title">{item.title}</span>
              {#if item.shortcut}
                <kbd class="item-shortcut">{item.shortcut}</kbd>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .palette-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    padding-top: 100px;
    z-index: 100;
  }
  .palette-modal {
    width: 520px;
    max-height: 380px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: fadeInScale 0.12s ease-out;
  }
  @keyframes fadeInScale {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .input-wrapper {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f2;
    gap: 10px;
  }
  .search-icon {
    color: #8e8e93;
    flex-shrink: 0;
  }
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    color: #1d1d1f;
  }
  .esc-hint {
    font-size: 11px;
    color: #aeaeb2;
    background: #f2f2f7;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .action-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }
  .empty-tip {
    padding: 20px;
    text-align: center;
    color: #8e8e93;
    font-size: 13px;
  }
  .action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: #3a3a3c;
    cursor: pointer;
  }
  .action-item.selected {
    background: #007aff;
    color: #ffffff;
  }
  .item-shortcut {
    font-size: 11px;
    padding: 2px 5px;
    border-radius: 4px;
    background: #f2f2f7;
    color: #636366;
    border: 1px solid #d1d1d6;
  }
  .action-item.selected .item-shortcut {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    border-color: transparent;
  }
</style>
