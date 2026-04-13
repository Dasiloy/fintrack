export type CategoryTab =
  | { kind: 'all'; label: string }
  | { kind: 'category'; label: string; slug: string; color?: string };
