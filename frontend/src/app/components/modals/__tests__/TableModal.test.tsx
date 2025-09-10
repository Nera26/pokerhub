import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableModal from '../TableModal';

const defaultValues = {
  tableName: 'Test Table',
  gameType: 'texas',
  stakes: { small: 1, big: 2 },
  startingStack: 100,
  players: { max: 6 },
  buyIn: { min: 50, max: 200 },
};

const renderModal = () => {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  render(
    <TableModal
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      defaultValues={defaultValues}
      title="Create Table"
      submitLabel="Create"
    />,
  );
  return { onSubmit, onClose };
};

describe('TableModal', () => {
  it('submits form data', async () => {
    const { onSubmit } = renderModal();

    await userEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith(defaultValues, expect.anything());
  });

  it('calls onClose when close button clicked', async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalled();
  });
});
