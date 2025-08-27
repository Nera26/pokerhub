# Accessibility Guidelines

When building new components, ensure they meet the following accessibility standards:

- **Keyboard navigation**: All interactive elements must be reachable and operable with the keyboard. Use semantic HTML (`<button>`, `<a>`, etc.) and ensure focus states are visible.
- **Accessible names**: Provide a visible label or `aria-label` for controls. Icon-only buttons require an `aria-label` that describes their action.
- **Testing with axe-core**: Run `axe` against rendered components and ensure `results.violations` is empty. Accessibility tests belong alongside unit tests.
- **Focus management**: Manage focus when opening or closing modals, menus, and other overlays so the keyboard user never loses context.
- **ARIA attributes**: Use ARIA roles and properties sparingly and only when semantic HTML is insufficient. Keep them in sync with component state.

Following these guidelines keeps PokerHub usable for everyone and prevents accessibility regressions.

## Manual Accessibility Checklist

- [x] **Tab order and focus rings**: Confirm that pressing <kbd>Tab</kbd> moves focus through interactive elements in a logical order and that focus rings remain visible. Verified 2025-08-26 using manual keyboard navigation across dashboard and settings screens; no issues found.
- [x] **Escape key closes modals**: Ensure pressing <kbd>Esc</kbd> dismisses any open modal and returns focus to the control that opened it. Verified 2025-08-26 by opening a sample modal and pressing <kbd>Esc</kbd>; focus returned to the trigger button.
