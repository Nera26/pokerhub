import { render } from '@testing-library/react';
import StatusPill from '../common/StatusPill';
import { bonusStyles } from '../BonusManager';
import { auditStyles } from '../AuditLogs';

describe('StatusPill mappings', () => {
  it.each(Object.entries(bonusStyles))(
    'renders bonus status %s with correct style',
    (status, className) => {
      const label = status.toUpperCase();
      const { getByText } = render(<StatusPill label={label} className={className} />);
      const pill = getByText(label);
      className.split(' ').forEach((c) => expect(pill).toHaveClass(c));
    },
  );

  it.each(Object.entries(auditStyles))(
    'renders audit status %s with correct style',
    (status, className) => {
      const { getByText } = render(
        <StatusPill label={status} className={className} />,
      );
      const pill = getByText(status);
      className.split(' ').forEach((c) => expect(pill).toHaveClass(c));
    },
  );
});
