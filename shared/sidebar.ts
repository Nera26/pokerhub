export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  disabled?: boolean;
}

export type SidebarConfig = SidebarItem[];
