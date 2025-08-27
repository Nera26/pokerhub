import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  framework: { name: '@storybook/nextjs-vite', options: {} },
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // no essentials/interactions in SB9
  ],
};
export default config;
