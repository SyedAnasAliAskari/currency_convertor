import type { ConversionResult, Currency } from './types';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`);
  } catch {
    throw new Error('Unable to reach the currency service. Please try again.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'The currency service returned an error.');
  }
  return body as T;
}

export const currencyApi = {
  getCurrencies: () => request<Currency[]>('/currencies'),
  convert: (from: string, to: string, amount: number, date?: string) => {
    const params = new URLSearchParams({ from, to, amount: String(amount) });
    if (date) params.set('date', date);
    return request<ConversionResult>(`/convert?${params.toString()}`);
  },
};
