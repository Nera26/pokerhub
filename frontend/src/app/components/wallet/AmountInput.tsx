'use client';

import Input, { type InputProps } from '../ui/Input';

export interface AmountInputProps extends Omit<InputProps, 'type'> {}

export default function AmountInput(props: AmountInputProps) {
  return <Input type="number" placeholder="0.00" {...props} />;
}

