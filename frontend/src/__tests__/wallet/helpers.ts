import { render } from '@testing-library/react';
import { createElement, type ComponentProps } from 'react';

import DepositSection from '@/app/components/wallet/DepositSection';

// Re-export shared wallet testing utilities
export { setupCountdownTimers, setupClipboardMocks } from '../utils/wallet';

type DepositSectionProps = ComponentProps<typeof DepositSection>;

/**
 * Render the DepositSection component with sensible defaults.
 * Allows overriding props when needed.
 */
export function renderDepositSection(props: Partial<DepositSectionProps> = {}) {
  const result = render(
    createElement(DepositSection, {
      onClose: jest.fn(),
      onConfirm: jest.fn(),
      ...props,
    }),
  );

  const rerender = (newProps: Partial<DepositSectionProps> = {}) =>
    result.rerender(
      createElement(DepositSection, {
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        ...newProps,
      }),
    );

  return { ...result, rerender };
}
