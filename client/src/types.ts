export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  date: string | null;
}

export interface HistoryItem extends ConversionResult {
  id: string;
  createdAt: string;
}
