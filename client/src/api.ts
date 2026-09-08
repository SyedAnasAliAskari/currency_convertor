import type { ConversionResult, Currency } from './types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = (configuredApiUrl || (import.meta.env.DEV ? '/api' : '')).replace(/\/$/, '');

async function request<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error('The deployed API URL is missing. Set VITE_API_URL on your hosting provider and redeploy.');
  }

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
  if (body === null) {
    throw new Error('The server returned an invalid response. Check VITE_API_URL and redeploy the site.');
  }
  return body as T;
}

export const currencyApi = {
  getCurrencies: async () => {
    const currencies = await request<unknown>('/currencies');
    if (!Array.isArray(currencies)) {
      throw new Error('The currencies response is invalid. Check the deployed backend URL.');
    }
    return currencies as Currency[];
  },
  convert: (from: string, to: string, amount: number, date?: string) => {
    const params = new URLSearchParams({ from, to, amount: String(amount) });
    if (date) params.set('date', date);
    return request<ConversionResult>(`/convert?${params.toString()}`);
  },
};
