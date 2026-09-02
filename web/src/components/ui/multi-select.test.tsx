import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from './multi-select';

const options = [
  { value: 'rembrandt', label: 'Rembrandt' },
  { value: 'caravaggio', label: 'Caravaggio' },
  { value: 'ticiano', label: 'Ticiano' },
];

describe('MultiSelect', () => {
  it('mostra o placeholder quando nada está selecionado', () => {
    render(<MultiSelect options={options} selected={[]} onChange={vi.fn()} placeholder="Todos os artistas" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Todos os artistas');
  });

  it('mostra o nome do único selecionado, e "N selecionados" com 2+', () => {
    const { rerender } = render(<MultiSelect options={options} selected={['rembrandt']} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Rembrandt');

    rerender(<MultiSelect options={options} selected={['rembrandt', 'ticiano']} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('2 selecionados');
  });

  it('abre o popover e chama onChange ao clicar numa opção (toggle liga)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} selected={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Caravaggio'));

    expect(onChange).toHaveBeenCalledWith(['caravaggio']);
  });

  it('clicar numa opção já selecionada remove ela (toggle desliga)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} selected={['caravaggio', 'ticiano']} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Caravaggio'));

    expect(onChange).toHaveBeenCalledWith(['ticiano']);
  });

  it('filtra as opções pela busca digitada', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} selected={[]} onChange={vi.fn()} searchPlaceholder="Buscar..." />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Buscar...'), 'tici');

    expect(screen.getByText('Ticiano')).toBeInTheDocument();
    expect(screen.queryByText('Rembrandt')).not.toBeInTheDocument();
  });
});
