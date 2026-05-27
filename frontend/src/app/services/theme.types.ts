export type ThemeId = 'default' | 'lcars47';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  accent: string;
  surface: string;
}

export const THEME_STORAGE_KEY = 'pldyn-theme';

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'default',
    label: 'PlDyn',
    description: 'Default — dark blue overlay',
    accent: '#0159B5',
    surface: '#091a3a',
  },
  {
    id: 'lcars47',
    label: 'LCARS 47',
    description: 'Star Trek TNG era console',
    accent: '#FF9900',
    surface: '#000000',
  },
];
