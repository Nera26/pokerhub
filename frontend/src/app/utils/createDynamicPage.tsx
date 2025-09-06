import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export default function createDynamicPage(
  importer: () => Promise<{ default: ComponentType }>,
) {
  return dynamic(importer, {
    loading: () => <div>Loading...</div>,
  });
}
