export enum ThemeColor {
  Blue = 'blue',
  Red = 'red',
  Green = 'green',
  Yellow = 'yellow',
}

export const themeColorMap: Record<ThemeColor, string> = {
  [ThemeColor.Blue]: 'bg-info hover:brightness-110 text-white',
  [ThemeColor.Red]: 'bg-danger hover:brightness-110 text-white',
  [ThemeColor.Green]: 'bg-success hover:brightness-110 text-white',
  [ThemeColor.Yellow]: 'bg-accent hover:brightness-110 text-black',
};
