export interface HeadingItem {
  level: number;
  text: string;
  line: number;
  pos: number;
}

export interface CommandAction {
  id: string;
  title: string;
  shortcut?: string;
  action: () => void;
}
