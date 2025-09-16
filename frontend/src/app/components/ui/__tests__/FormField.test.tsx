import './setupLoggerMock';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SelectField, TextField } from '../FormField';

function TextFieldForm() {
  const schema = z.object({ name: z.string().min(1, { message: 'Required' }) });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <TextField
        id="name"
        label="Name"
        name="name"
        register={register}
        errors={errors}
      />
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
    { value: 'blue', label: 'Blue' },
  ];

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <SelectField
        id="color"
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

describe('FormField', () => {
  it('shows TextField validation errors', async () => {
    const user = userEvent.setup();
    render(<TextFieldForm />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('renders select options and shows errors', async () => {
    const user = userEvent.setup();
    render(<SelectFieldForm />);

    const optionTexts = screen
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionTexts).toEqual(['Select a color', 'Red', 'Blue']);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
