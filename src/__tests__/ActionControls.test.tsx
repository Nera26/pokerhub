import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BetInput,
  AutoActions,
  BetInputProps,
  AutoActionsProps,
} from '@/app/components/tables/ActionControls';
import { useState } from 'react';

const defaultBetProps: BetInputProps = {
  currentBet: 0,
  callAmount: 0,
  pot: 10,
  effective: 100,
  bigBlind: 5,
  minTotal: 5,
  maxTotal: 100,
  sliderTotal: 5,
  onSliderChange: () => {},
};

const defaultAutoProps: AutoActionsProps = {
  autoCheckFold: false,
  onToggleAutoCheckFold: () => {},
  autoFoldAny: false,
  onToggleAutoFoldAny: () => {},
  autoCallAny: false,
  onToggleAutoCallAny: () => {},
};
describe('BetInput', () => {
  it('updates slider and calls handler', () => {
    const onSliderChange = jest.fn();
    const Wrapper = () => {
      const [total, setTotal] = useState(5);
      return (
        <BetInput
          {...defaultBetProps}
          sliderTotal={total}
          onSliderChange={(v) => {
            onSliderChange(v);
            setTotal(v);
          }}
        />
      );
    };
    render(<Wrapper />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });
    expect(onSliderChange).toHaveBeenCalledWith(20);
    expect(screen.getByText('$20')).toBeInTheDocument();
  });
});

describe('AutoActions', () => {
  it('toggles auto-action checkboxes', async () => {
    const onToggleAutoCheckFold = jest.fn();
    const onToggleAutoFoldAny = jest.fn();
    const onToggleAutoCallAny = jest.fn();
    render(
      <AutoActions
        {...defaultAutoProps}
        onToggleAutoCheckFold={onToggleAutoCheckFold}
        onToggleAutoFoldAny={onToggleAutoFoldAny}
        onToggleAutoCallAny={onToggleAutoCallAny}
      />,
    );
    const user = userEvent.setup();

    await user.click(screen.getByLabelText(/check\/fold/i));
    expect(onToggleAutoCheckFold).toHaveBeenCalledWith(true);

    await user.click(screen.getByLabelText(/fold to any bet/i));
    expect(onToggleAutoFoldAny).toHaveBeenCalledWith(true);

    await user.click(screen.getByLabelText(/call any/i));
    expect(onToggleAutoCallAny).toHaveBeenCalledWith(true);
  });
});
