import { EditorView } from "@codemirror/view";

export const typoraTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', Roboto, Helvetica, Arial, sans-serif",
    color: "#24292f",
    backgroundColor: "#ffffff",
  },
  ".cm-content": {
    padding: "40px 10% 200px 10%",
    maxWidth: "920px",
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

  // 标题阶梯排版
  ".wrmd-h1": {
    fontSize: "2.1rem",
    fontWeight: "700",
    lineHeight: "1.35",
    color: "#1f2328",
    borderBottom: "1px solid #d0d7de",
    paddingBottom: "8px",
    paddingTop: "16px",
  },
  ".wrmd-h2": {
    fontSize: "1.65rem",
    fontWeight: "600",
    lineHeight: "1.35",
    color: "#1f2328",
    borderBottom: "1px solid #eaeef2",
    paddingBottom: "6px",
    paddingTop: "14px",
  },
  ".wrmd-h3": {
    fontSize: "1.35rem",
    fontWeight: "600",
    color: "#1f2328",
    paddingTop: "12px",
  },
  ".wrmd-h4": {
    fontSize: "1.15rem",
    fontWeight: "600",
    color: "#24292f",
    paddingTop: "8px",
  },
  ".wrmd-h5": {
    fontSize: "1.05rem",
    fontWeight: "600",
    color: "#24292f",
    paddingTop: "6px",
  },
  ".wrmd-h6": {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#57606a",
    paddingTop: "4px",
  },

  // 弱化的 Markdown 语法符号（选中/编辑状态时轻微显色，保留可选中编辑特性）
  ".wrmd-mark-faint": {
    color: "#94a3b8 !important",
    fontWeight: "normal !important",
    opacity: "0.85",
  },
  ".wrmd-heading-mark": {
    color: "#94a3b8 !important",
    fontWeight: "500 !important",
    marginRight: "4px",
  },

  // 列表行与圆点 Bullet
  ".wrmd-list-line": {
    padding: "2px 0",
  },
  ".wrmd-bullet-widget": {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#0969da",
    marginRight: "10px",
    marginLeft: "2px",
    verticalAlign: "middle",
    position: "relative",
    top: "-1px",
    flexShrink: "0",
  },

  // 任务清单组件与完成划线
  ".wrmd-task-wrap": {
    display: "inline-flex",
    alignItems: "center",
    marginRight: "8px",
    verticalAlign: "middle",
  },
  ".wrmd-task-checkbox": {
    width: "15px",
    height: "15px",
    cursor: "pointer",
    accentColor: "#0969da",
    margin: "0",
    borderRadius: "3px",
  },
  ".wrmd-task-done": {
    textDecoration: "line-through",
    color: "#8c959f !important",
  },

  // 粗体、斜体、删除线
  ".wrmd-bold": {
    fontWeight: "700",
    color: "inherit",
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
    padding: "0.15em 0.4em",
    borderRadius: "4px",
    fontSize: "88%",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    color: "#cf222e",
  },

  // 超链接
  ".wrmd-link": {
    color: "#0969da",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    cursor: "pointer",
    transition: "color 0.15s ease",
  },
  ".wrmd-link:hover": {
    color: "#0550ae",
  },
  ".wrmd-link-url": {
    color: "#8c959f",
    fontSize: "88%",
    fontFamily: "ui-monospace, monospace",
    marginLeft: "2px",
  },

  // 引用块
  ".wrmd-blockquote": {
    borderLeft: "4px solid #0969da !important",
    paddingLeft: "16px !important",
    color: "#57606a",
    backgroundColor: "rgba(9, 105, 218, 0.04)",
    borderRadius: "0 4px 4px 0",
    margin: "4px 0",
  },

  // 水平分割线
  ".wrmd-hr": {
    display: "block",
    height: "2px",
    backgroundColor: "#e1e4e8",
    margin: "24px 0",
    border: "none",
    borderRadius: "1px",
  },

  // 代码块行
  ".wrmd-code-line": {
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "14px",
    backgroundColor: "#f6f8fa",
    paddingLeft: "16px !important",
    paddingRight: "16px !important",
    lineHeight: "1.6",
  }
});
