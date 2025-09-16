export function normalizeSidebarIcon(name: string): string {
  if (!name) return name;
  if (name.startsWith('fa')) return name;
  const pascal = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `fa${pascal}`;
}

