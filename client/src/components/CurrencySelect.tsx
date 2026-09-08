import type { Currency } from '../types';

interface Props {
  id: string;
  label: string;
  value: string;
  currencies: Currency[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function CurrencySelect({ id, label, value, currencies, disabled, onChange }: Props) {
  return (
    <div className="currency-field">
      <label className="form-label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className="form-select form-select-lg"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
}
