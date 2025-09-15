import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, SelectField } from '../fields';

function TextFieldForm() {
  const schema = z.object({ name: z.string().min(1, { message: 'Required' }) });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <TextField name="name" label="Name" register={register} errors={errors} />
      <button type="submit">Submit</button>
    </form>
  );
}

function SelectFieldForm() {
  const schema = z.object({
    color: z.string().min(1, { message: 'Required' }),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ color: string }>({
    resolver: zodResolver(schema),
    defaultValues: { color: '' },
  });
  const options = [
    { value: '', label: 'Select a color' },
    { value: 'red', label: 'Red' },
  ];
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <SelectField
        name="color"
        label="Color"
        register={register}
        errors={errors}
        options={options}
        defaultValue=""
      />
      <button type="submit">Submit</button>
    </form>
  );
}

describe('fields', () => {
  const user = userEvent.setup();

  it('shows TextField errors', async () => {
    render(<TextFieldForm />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('shows SelectField errors', async () => {
    render(<SelectFieldForm />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
