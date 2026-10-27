<script lang="ts">
  export interface HeadingItem {
    level: number;
    text: string;
    line: number;
    pos: number;
  }

  export let headings: HeadingItem[] = [];
  export let isOpen: boolean = false;
  export let onSelectHeading: (item: HeadingItem) => void = () => {};
  export let onClose: () => void = () => {};
</script>

{#if isOpen}
  <aside class="outline-drawer">
    <div class="outline-header">
      <span class="title">目录大纲</span>
      <button class="close-btn" on:click={onClose} title="关闭">✕</button>
    </div>
    <div class="outline-content">
      {#if headings.length === 0}
        <div class="empty-state">暂无标题结构</div>
      {:else}
        <ul class="heading-list">
          {#each headings as item}
            <li
              class="heading-item level-{item.level}"
              on:click={() => onSelectHeading(item)}
            >
              <span class="dot"></span>
              <span class="text">{item.text}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .outline-drawer {
    width: 240px;
    height: 100%;
    background: #f7f7f9;
    border-right: 1px solid #e5e5ea;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    user-select: none;
    z-index: 10;
  }
  .outline-header {
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid #e5e5ea;
    font-size: 12px;
    font-weight: 600;
    color: #48484a;
  }
  .close-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    color: #8e8e93;
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 4px;
  }
  .close-btn:hover {
    background: #e5e5ea;
    color: #1d1d1f;
  }
  .outline-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: #aeaeb2;
    font-size: 13px;
  }
  .heading-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .heading-item {
    padding: 5px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #3a3a3c;
    cursor: pointer;
    transition: background 0.1s ease;
  }
  .heading-item:hover {
    background: #ebebf0;
    color: #007aff;
  }
  .heading-item .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #8e8e93;
    flex-shrink: 0;
  }
  .heading-item .text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .level-1 { font-weight: 600; padding-left: 12px; }
  .level-2 { padding-left: 24px; }
  .level-3 { padding-left: 36px; color: #636366; }
  .level-4 { padding-left: 48px; color: #8e8e93; }
</style>
