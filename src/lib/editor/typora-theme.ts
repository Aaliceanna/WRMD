import { EditorView } from "@codemirror/view";

export const typoraTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', Roboto, Helvetica, Arial, sans-serif",
    color: "#24292f",
    backgroundColor: "#ffffff",
  },
  ".cm-content": {
    padding: "40px 10% 200px 10%",
    maxWidth: "960px",
    margin: "0 auto",
    lineHeight: "1.75",
    caretColor: "#0969da",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#0969da",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "#b3d7ff !important",
  },
  ".cm-line": {
    padding: "2px 0",
  },
  // 标题样式
  ".wrmd-h1": {
    fontSize: "2.1rem",
    fontWeight: "700",
    lineHeight: "1.3",
    color: "#1f2328",
    borderBottom: "1px solid #d0d7de",
    paddingBottom: "8px",
    marginTop: "24px",
    marginBottom: "12px",
  },
  ".wrmd-h2": {
    fontSize: "1.65rem",
    fontWeight: "600",
    lineHeight: "1.35",
    color: "#1f2328",
    borderBottom: "1px solid #eaeef2",
    paddingBottom: "6px",
    marginTop: "20px",
    marginBottom: "10px",
  },
  ".wrmd-h3": {
    fontSize: "1.35rem",
    fontWeight: "600",
    color: "#1f2328",
    marginTop: "16px",
    marginBottom: "8px",
  },
  ".wrmd-h4": {
    fontSize: "1.15rem",
    fontWeight: "600",
    color: "#24292f",
    marginTop: "12px",
  },
  // 隐藏的 Markdown 语法符号（光标移出时折叠）
  ".wrmd-mark-hide": {
    display: "none !important",
  },
  // 弱化的 Markdown 语法符号（处于激活编辑态时轻度显色）
  ".wrmd-mark-faint": {
    color: "#8c959f !important",
    fontWeight: "normal !important",
    userSelect: "none",
  },
  // 粗体、斜体与删除线
  ".wrmd-bold": {
    fontWeight: "700",
  },
  ".wrmd-italic": {
    fontStyle: "italic",
  },
  ".wrmd-strikethrough": {
    textDecoration: "line-through",
    color: "#656d76",
  },
  // 行内代码
  ".wrmd-inline-code": {
    backgroundColor: "rgba(175, 184, 193, 0.2)",
    padding: "0.2em 0.4em",
    borderRadius: "4px",
    fontSize: "88%",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    color: "#cf222e",
  },
  // 引用块
  ".wrmd-blockquote": {
    borderLeft: "4px solid #d0d7de",
    paddingLeft: "16px",
    color: "#57606a",
    margin: "12px 0",
  },
  // 水平分割线
  ".wrmd-hr": {
    display: "block",
    height: "2px",
    backgroundColor: "#d0d7de",
    margin: "24px 0",
    border: "none",
  },
  // 任务复选框
  ".wrmd-task-checkbox": {
    marginRight: "8px",
    cursor: "pointer",
    accentColor: "#0969da",
  }
});
