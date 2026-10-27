import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";

// 分割线 Widget
class HrWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "wrmd-hr";
    return hr;
  }
}

// 任务复选框 Widget
class TaskCheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly pos: number) {
    super();
  }
  toDOM(view: EditorView) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = "wrmd-task-checkbox";
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("change", (e) => {
      e.stopPropagation();
      const newChar = input.checked ? "x" : " ";
      // 替换 [ ] 或 [x] 中的字符
      view.dispatch({
        changes: { from: this.pos + 3, to: this.pos + 4, insert: newChar }
      });
    });
    return input;
  }
}

export function createLivePreviewPlugin(enabledGetter: () => boolean) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.computeDecorations(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet ||
          update.focusChanged
        ) {
          this.decorations = this.computeDecorations(update.view);
        }
      }

      computeDecorations(view: EditorView): DecorationSet {
        if (!enabledGetter()) {
          return Decoration.none;
        }

        const builder = new RangeSetBuilder<Decoration>();
        const { state } = view;
        const selection = state.selection.main;
        const cursorFrom = selection.from;
        const cursorTo = selection.to;
        const cursorLine = state.doc.lineAt(cursorFrom);

        // 遍历视口可见区域的语法树节点
        for (const { from, to } of view.visibleRanges) {
          syntaxTree(state).iterate({
            from,
            to,
            enter: (node) => {
              const nodeLine = state.doc.lineAt(node.from);
              const isCursorOnThisLine =
                cursorLine.number >= nodeLine.number &&
                cursorLine.number <= state.doc.lineAt(node.to).number;

              // 1. 标题 (ATXHeading1 ~ ATXHeading6)
              if (node.name.startsWith("ATXHeading")) {
                const level = parseInt(node.name.replace("ATXHeading", "")) || 1;
                const headerClass = `wrmd-h${level}`;
                
                // 标记整行具有大标题样式
                builder.add(
                  nodeLine.from,
                  nodeLine.from,
                  Decoration.line({ class: headerClass })
                );

                // 找到开头的 `# ` 标记
                const lineText = state.sliceDoc(nodeLine.from, nodeLine.to);
                const markMatch = lineText.match(/^(#{1,6}\s+)/);
                if (markMatch) {
                  const markLen = markMatch[1].length;
                  if (isCursorOnThisLine) {
                    // 光标在此行：符号半透明淡化显示，便于编辑
                    builder.add(
                      nodeLine.from,
                      nodeLine.from + markLen,
                      Decoration.mark({ class: "wrmd-mark-faint" })
                    );
                  } else {
                    // 光标离开：直接折叠隐藏前面的 `# `
                    builder.add(
                      nodeLine.from,
                      nodeLine.from + markLen,
                      Decoration.replace({})
                    );
                  }
                }
              }

              // 2. 粗体 (StrongEmphasis: **text**)
              else if (node.name === "StrongEmphasis") {
                const isCursorInside = cursorTo >= node.from && cursorFrom <= node.to;
                if (!isCursorInside) {
                  // 折叠前后的 **
                  if (node.to - node.from >= 4) {
                    builder.add(node.from, node.from + 2, Decoration.replace({}));
                    builder.add(node.from + 2, node.to - 2, Decoration.mark({ class: "wrmd-bold" }));
                    builder.add(node.to - 2, node.to, Decoration.replace({}));
                  }
                }
              }

              // 3. 斜体 (Emphasis: *text*)
              else if (node.name === "Emphasis") {
                const isCursorInside = cursorTo >= node.from && cursorFrom <= node.to;
                if (!isCursorInside) {
                  if (node.to - node.from >= 2) {
                    builder.add(node.from, node.from + 1, Decoration.replace({}));
                    builder.add(node.from + 1, node.to - 1, Decoration.mark({ class: "wrmd-italic" }));
                    builder.add(node.to - 1, node.to, Decoration.replace({}));
                  }
                }
              }

              // 4. 行内代码 (InlineCode: `code`)
              else if (node.name === "InlineCode") {
                const isCursorInside = cursorTo >= node.from && cursorFrom <= node.to;
                if (!isCursorInside) {
                  if (node.to - node.from >= 2) {
                    builder.add(node.from, node.from + 1, Decoration.replace({}));
                    builder.add(node.from + 1, node.to - 1, Decoration.mark({ class: "wrmd-inline-code" }));
                    builder.add(node.to - 1, node.to, Decoration.replace({}));
                  }
                }
              }

              // 5. 引用块 (Blockquote)
              else if (node.name === "Blockquote") {
                builder.add(
                  nodeLine.from,
                  nodeLine.from,
                  Decoration.line({ class: "wrmd-blockquote" })
                );
              }

              // 6. 水平分割线 (HorizontalRule)
              else if (node.name === "HorizontalRule") {
                if (!isCursorOnThisLine) {
                  builder.add(
                    node.from,
                    node.to,
                    Decoration.replace({ widget: new HrWidget() })
                  );
                }
              }

              // 7. 任务复选框 (Task)
              else if (node.name === "Task") {
                const taskText = state.sliceDoc(node.from, node.from + 5);
                const isChecked = taskText.toLowerCase().includes("[x]");
                if (!isCursorOnThisLine) {
                  builder.add(
                    node.from,
                    node.from + 5,
                    Decoration.replace({
                      widget: new TaskCheckboxWidget(isChecked, node.from)
                    })
                  );
                }
              }
            }
          });
        }

        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations
    }
  );
}
