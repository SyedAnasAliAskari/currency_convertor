// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { code: 'USD', name: 'US Dollar', symbol: '$', symbolNative: '$', decimalDigits: 2 },
        { code: 'EUR', name: 'Euro', symbol: '€', symbolNative: '€', decimalDigits: 2 },
      ],
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('loads currencies and renders the conversion form', async () => {
    render(<App />);
    expect(screen.getByText(/loading supported currencies/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('From')).toHaveValue('USD'));
    expect(screen.getByRole('button', { name: /convert now/i })).toBeEnabled();
  });
});

