import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { RangeSet, type Range } from "@codemirror/state";

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
  constructor(readonly checked: boolean, readonly charPos: number) {
    super();
  }

  eq(other: TaskCheckboxWidget) {
    return this.checked === other.checked && this.charPos === other.charPos;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement("span");
    wrap.className = "wrmd-task-wrap";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = "wrmd-task-checkbox";
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("change", (e) => {
      e.stopPropagation();
      const newChar = input.checked ? "x" : " ";
      view.dispatch({
        changes: { from: this.charPos, to: this.charPos + 1, insert: newChar }
      });
    });
    wrap.appendChild(input);
    return wrap;
  }
}

// 无序列表 Bullet Widget (• 圆点)
class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "wrmd-bullet-widget";
    span.setAttribute("aria-hidden", "true");
    return span;
  }
}

// 判断指定区间是否与用户的任意光标或文本选区产生交集（用于行内格式符：**、*、` 等）
function isRangeSelected(
  from: number,
  to: number,
  ranges: readonly { from: number; to: number }[]
): boolean {
  for (const r of ranges) {
    if (r.to >= from && r.from <= to) {
      return true;
    }
  }
  return false;
}

// 判断某行是否处于光标当前所在行或选区覆盖行（用于行级标记：#、-、>、--- 等）
function isLineSelected(
  lineFrom: number,
  lineTo: number,
  ranges: readonly { from: number; to: number }[]
): boolean {
  for (const r of ranges) {
    if (r.to >= lineFrom && r.from <= lineTo) {
      return true;
    }
  }
  return false;
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

        const { state } = view;
        const ranges = state.selection.ranges;
        const decos: Range<Decoration>[] = [];
        const lineClasses = new Map<number, Set<string>>();

        function addLineClass(lineStart: number, cls: string) {
          let set = lineClasses.get(lineStart);
          if (!set) {
            set = new Set<string>();
            lineClasses.set(lineStart, set);
          }
          set.add(cls);
        }

        const processedListLines = new Set<number>();
        const processedQuoteLines = new Set<number>();
        const processedHeadingLines = new Set<number>();

        // 遍历所有可见范围内的语法树节点
        for (const { from, to } of view.visibleRanges) {
          syntaxTree(state).iterate({
            from,
            to,
            enter: (node) => {
              // 1. 标题 (ATXHeading1 ~ ATXHeading6)
              if (node.name.startsWith("ATXHeading")) {
                const level = parseInt(node.name.replace("ATXHeading", "")) || 1;
                const nodeLine = state.doc.lineAt(node.from);

                if (!processedHeadingLines.has(nodeLine.number)) {
                  processedHeadingLines.add(nodeLine.number);
                  addLineClass(nodeLine.from, `wrmd-h${level}`);

                  // 匹配开头的 `# `、`## ` 等符号
                  const lineText = state.sliceDoc(nodeLine.from, nodeLine.to);
                  const m = lineText.match(/^(\s*)(#{1,6}\s+)/);
                  if (m) {
                    const markFrom = nodeLine.from + m[1].length;
                    const markTo = markFrom + m[2].length;
                    const isEditing = isLineSelected(nodeLine.from, nodeLine.to, ranges);

                    if (isEditing) {
                      // 选中或光标在该行：显示实际的 # 符号，以便直观编辑
                      decos.push(
                        Decoration.mark({
                          class: "wrmd-mark-faint wrmd-heading-mark"
                        }).range(markFrom, markTo)
                      );
                    } else {
                      // 光标离开该行：折叠隐藏 # 符号，呈现纯净无干扰大标题
                      decos.push(Decoration.replace({}).range(markFrom, markTo));
                    }
                  }
                }
              }

              // 2. 列表项 (ListItem: 包括普通无序列表 `- ` 与任务列表 `- [ ]`)
              else if (node.name === "ListItem") {
                const line = state.doc.lineAt(node.from);
                if (!processedListLines.has(line.number)) {
                  processedListLines.add(line.number);
                  addLineClass(line.from, "wrmd-list-line");

                  const lineText = line.text;
                  const isEditing = isLineSelected(line.from, line.to, ranges);

                  // 优先检查是否为任务清单项 (如 `- [ ] `、`* [x] `)
                  const taskMatch = lineText.match(/^(\s*)([-*+])\s+(\[[ xX]\])(\s*)/);
                  if (taskMatch) {
                    const indentLen = taskMatch[1].length;
                    const markerText = taskMatch[2];
                    const boxText = taskMatch[3];
                    const isChecked = boxText.toLowerCase() === "[x]";
                    const fullMarkFrom = line.from + indentLen;
                    // 指向 [ ] 或 [x] 内字符的精确定位
                    const charPos = fullMarkFrom + markerText.length + 1 + 1;
                    const fullMarkTo = fullMarkFrom + taskMatch[0].length;

                    if (isEditing) {
                      // 选中编辑该行时：显示实际的 `- [ ]` 符号，方便键盘快速修改
                      decos.push(
                        Decoration.mark({ class: "wrmd-mark-faint" }).range(
                          fullMarkFrom,
                          fullMarkTo
                        )
                      );
                    } else {
                      // 浏览渲染状态：替换为可点击勾选的精美复选框组件
                      decos.push(
                        Decoration.replace({
                          widget: new TaskCheckboxWidget(isChecked, charPos)
                        }).range(fullMarkFrom, fullMarkTo)
                      );
                      if (isChecked) {
                        decos.push(
                          Decoration.mark({ class: "wrmd-task-done" }).range(
                            fullMarkTo,
                            line.to
                          )
                        );
                      }
                    }
                  } else {
                    // 普通无序列表项 (如 `- `、`* `、`+ `)
                    const bulletMatch = lineText.match(/^(\s*)([-*+])(\s+)/);
                    if (bulletMatch) {
                      const indentLen = bulletMatch[1].length;
                      const markFrom = line.from + indentLen;
                      const markTo = markFrom + bulletMatch[2].length + bulletMatch[3].length;

                      if (isEditing) {
                        // 选中编辑该行时：显示实际的 `- ` 等前缀符号
                        decos.push(
                          Decoration.mark({ class: "wrmd-mark-faint" }).range(
                            markFrom,
                            markTo
                          )
                        );
                      } else {
                        // 浏览渲染状态：替换为主流 Typora 风格的圆点 Bullet
                        decos.push(
                          Decoration.replace({
                            widget: new BulletWidget()
                          }).range(markFrom, markTo)
                        );
                      }
                    }
                  }
                }
              }

              // 3. 引用块 (Blockquote)
              else if (node.name === "Blockquote") {
                const startLine = state.doc.lineAt(node.from);
                const endLine = state.doc.lineAt(node.to);
                for (let l = startLine.number; l <= endLine.number; l++) {
                  if (!processedQuoteLines.has(l)) {
                    processedQuoteLines.add(l);
                    const curLine = state.doc.line(l);
                    addLineClass(curLine.from, "wrmd-blockquote");

                    const qMatch = curLine.text.match(/^(\s*)(>{1,5}\s?)/);
                    if (qMatch) {
                      const qFrom = curLine.from + qMatch[1].length;
                      const qTo = qFrom + qMatch[2].length;
                      const isEditing = isLineSelected(curLine.from, curLine.to, ranges);

                      if (isEditing) {
                        // 选中编辑该行时：显示实际的 `>` 符号
                        decos.push(
                          Decoration.mark({ class: "wrmd-mark-faint" }).range(qFrom, qTo)
                        );
                      } else {
                        // 浏览状态：隐藏 `>` 符号，仅保留左侧竖线与引用样式
                        decos.push(Decoration.replace({}).range(qFrom, qTo));
                      }
                    }
                  }
                }
              }

              // 4. 粗体 (StrongEmphasis: **text** 或 __text__)
              else if (node.name === "StrongEmphasis") {
                const text = state.sliceDoc(node.from, node.to);
                if (
                  (text.startsWith("**") && text.endsWith("**")) ||
                  (text.startsWith("__") && text.endsWith("__"))
                ) {
                  if (node.to - node.from >= 4) {
                    const isEditing = isRangeSelected(node.from, node.to, ranges);
                    const innerFrom = node.from + 2;
                    const innerTo = node.to - 2;

                    // 核心优化：文字本身始终具有粗体样式，编辑时不会退化成普通字体
                    decos.push(
                      Decoration.mark({ class: "wrmd-bold" }).range(innerFrom, innerTo)
                    );

                    if (isEditing) {
                      // 选中或光标进入时：显示实际的 ** 符号，便于修改
                      decos.push(
                        Decoration.mark({ class: "wrmd-mark-faint" }).range(
                          node.from,
                          innerFrom
                        )
                      );
                      decos.push(
                        Decoration.mark({ class: "wrmd-mark-faint" }).range(
                          innerTo,
                          node.to
                        )
                      );
                    } else {
                      // 未选中时：隐藏两端的 **
                      decos.push(Decoration.replace({}).range(node.from, innerFrom));
                      decos.push(Decoration.replace({}).range(innerTo, node.to));
                    }
                  }
                }
              }

              // 5. 斜体 (Emphasis: *text* 或 _text_)
              else if (node.name === "Emphasis") {
                const text = state.sliceDoc(node.from, node.to);
                if (
                  (text.startsWith("*") && text.endsWith("*")) ||
                  (text.startsWith("_") && text.endsWith("_"))
                ) {
                  if (node.to - node.from >= 2) {
                    const isEditing = isRangeSelected(node.from, node.to, ranges);
                    const innerFrom = node.from + 1;
                    const innerTo = node.to - 1;

                    // 文字始终保持斜体
                    decos.push(
                      Decoration.mark({ class: "wrmd-italic" }).range(innerFrom, innerTo)
                    );

                    if (isEditing) {
                      // 选中或光标进入时：显示实际的 * 符号
                      decos.push(
                        Decoration.mark({ class: "wrmd-mark-faint" }).range(
                          node.from,
                          innerFrom
                        )
                      );
                      decos.push(
                        Decoration.mark({ class: "wrmd-mark-faint" }).range(
                          innerTo,
                          node.to
                        )
                      );
                    } else {
                      // 未选中时：隐藏两端的 *
                      decos.push(Decoration.replace({}).range(node.from, innerFrom));
                      decos.push(Decoration.replace({}).range(innerTo, node.to));
                    }
                  }
                }
              }

              // 6. 删除线 (Strikethrough: ~~text~~)
              else if (node.name === "Strikethrough") {
                const text = state.sliceDoc(node.from, node.to);
                if (text.startsWith("~~") && text.endsWith("~~") && node.to - node.from >= 4) {
                  const isEditing = isRangeSelected(node.from, node.to, ranges);
                  const innerFrom = node.from + 2;
                  const innerTo = node.to - 2;

                  decos.push(
                    Decoration.mark({ class: "wrmd-strikethrough" }).range(innerFrom, innerTo)
                  );

                  if (isEditing) {
                    decos.push(
                      Decoration.mark({ class: "wrmd-mark-faint" }).range(node.from, innerFrom)
                    );
                    decos.push(
                      Decoration.mark({ class: "wrmd-mark-faint" }).range(innerTo, node.to)
                    );
                  } else {
                    decos.push(Decoration.replace({}).range(node.from, innerFrom));
                    decos.push(Decoration.replace({}).range(innerTo, node.to));
                  }
                }
              }

              // 7. 行内代码 (InlineCode: `code`)
              else if (node.name === "InlineCode") {
                const text = state.sliceDoc(node.from, node.to);
                const m = text.match(/^(`+)/);
                const dLen = m ? m[1].length : 1;
                if (node.to - node.from >= dLen * 2) {
                  const isEditing = isRangeSelected(node.from, node.to, ranges);
                  const innerFrom = node.from + dLen;
                  const innerTo = node.to - dLen;

                  decos.push(
                    Decoration.mark({ class: "wrmd-inline-code" }).range(innerFrom, innerTo)
                  );

                  if (isEditing) {
                    decos.push(
                      Decoration.mark({ class: "wrmd-mark-faint" }).range(node.from, innerFrom)
                    );
                    decos.push(
                      Decoration.mark({ class: "wrmd-mark-faint" }).range(innerTo, node.to)
                    );
                  } else {
                    decos.push(Decoration.replace({}).range(node.from, innerFrom));
                    decos.push(Decoration.replace({}).range(innerTo, node.to));
                  }
                }
              }

              // 8. Markdown 链接 (Link: [text](url))
              else if (node.name === "Link") {
                const text = state.sliceDoc(node.from, node.to);
                const linkMatch = text.match(/^\[(.*?)\]\((.*?)\)$/);
                if (linkMatch) {
                  const titleLen = linkMatch[1].length;
                  const isEditing = isRangeSelected(node.from, node.to, ranges);
                  const titleFrom = node.from + 1;
                  const titleTo = titleFrom + titleLen;

                  if (isEditing) {
                    // 选中编辑时：完整显示 [标题](链接) 语法供编辑
                    decos.push(
                      Decoration.mark({ class: "wrmd-mark-faint" }).range(node.from, titleFrom)
                    );
                    decos.push(
                      Decoration.mark({ class: "wrmd-link" }).range(titleFrom, titleTo)
                    );
                    decos.push(
                      Decoration.mark({ class: "wrmd-link-url" }).range(titleTo, node.to)
                    );
                  } else {
                    // 浏览时：仅显示超链接文字，折叠括号与 URL
                    decos.push(Decoration.replace({}).range(node.from, titleFrom));
                    decos.push(
                      Decoration.mark({ class: "wrmd-link" }).range(titleFrom, titleTo)
                    );
                    decos.push(Decoration.replace({}).range(titleTo, node.to));
                  }
                }
              }

              // 9. 水平分割线 (HorizontalRule: `---` 或 `***`)
              else if (node.name === "HorizontalRule") {
                const line = state.doc.lineAt(node.from);
                const isEditing = isLineSelected(line.from, line.to, ranges);

                if (isEditing) {
                  decos.push(
                    Decoration.mark({ class: "wrmd-mark-faint" }).range(node.from, node.to)
                  );
                } else {
                  decos.push(
                    Decoration.replace({
                      widget: new HrWidget()
                    }).range(node.from, node.to)
                  );
                }
              }

              // 10. 栅格代码块 (FencedCode)
              else if (node.name === "FencedCode") {
                const startLine = state.doc.lineAt(node.from);
                const endLine = state.doc.lineAt(node.to);
                for (let l = startLine.number; l <= endLine.number; l++) {
                  const curLine = state.doc.line(l);
                  addLineClass(curLine.from, "wrmd-code-line");
                }
              }
            }
          });
        }

        // 添加所有已聚合的行样式
        for (const [lineFrom, classes] of lineClasses.entries()) {
          decos.push(
            Decoration.line({ class: Array.from(classes).join(" ") }).range(
              lineFrom,
              lineFrom
            )
          );
        }

        // 利用 RangeSet.of(decos, true) 自动统一按文档位置严格排序构建 DecorationSet
        return RangeSet.of(decos, true);
      }
    },
    {
      decorations: (v) => v.decorations
    }
  );
}
