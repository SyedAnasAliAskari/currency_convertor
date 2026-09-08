import { FormEvent, useEffect, useMemo, useState } from 'react';
import { currencyApi } from './api';
import { CurrencySelect } from './components/CurrencySelect';
import { HistoryList } from './components/HistoryList';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { ConversionResult, Currency, HistoryItem } from './types';

const HISTORY_KEY = 'flux-conversion-history-v1';
const MAX_HISTORY_ITEMS = 50;

function localDateString(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function App() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [useHistorical, setUseHistorical] = useState(false);
  const [date, setDate] = useState('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(HISTORY_KEY, []);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  const yesterday = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() - 1);
    return localDateString(value);
  }, []);

  useEffect(() => {
    let active = true;
    currencyApi.getCurrencies()
      .then((data) => {
        if (!active) return;
        setCurrencies(data);
        if (!data.some((currency) => currency.code === 'USD')) setFrom(data[0]?.code ?? '');
        if (!data.some((currency) => currency.code === 'EUR')) setTo(data[1]?.code ?? data[0]?.code ?? '');
      })
      .catch((requestError: Error) => active && setError(requestError.message))
      .finally(() => active && setLoadingCurrencies(false));
    return () => { active = false; };
  }, []);

  const selectedFrom = currencies.find((currency) => currency.code === from);
  const selectedTo = currencies.find((currency) => currency.code === to);

  function formatMoney(value: number, currency: string) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 6,
      }).format(value);
    } catch {
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${currency}`;
    }
  }

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setResult(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (useHistorical && !date) {
      setError('Choose a historical date.');
      return;
    }

    setConverting(true);
    try {
      const conversion = await currencyApi.convert(from, to, numericAmount, useHistorical ? date : undefined);
      setResult(conversion);
      const historyItem: HistoryItem = {
        ...conversion,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      };
      setHistory((current) => [historyItem, ...current].slice(0, MAX_HISTORY_ITEMS));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container app-container d-flex align-items-center justify-content-between">
          <a className="brand" href="#top" aria-label="Flux home">
            <span className="brand-mark"><i className="bi bi-arrow-down-up" /></span>
            <span>flux<span className="brand-dot">.</span></span>
          </a>
          <span className="live-badge"><span className="live-dot" /> Live market rates</span>
        </div>
      </header>

      <main id="top" className="container app-container">
        <section className="hero text-center">
          <p className="eyebrow mb-2">Simple. Fast. Reliable.</p>
          <h1>Money moves. Keep up.</h1>
          <p className="hero-copy mx-auto">Convert currencies with current or historical market rates, wherever you are.</p>
        </section>

        <section className="converter-card" aria-labelledby="converter-title">
          <div className="converter-heading d-flex align-items-start justify-content-between gap-3">
            <div>
              <p className="eyebrow mb-1">Currency converter</p>
              <h2 id="converter-title" className="h4 mb-0">Make a conversion</h2>
            </div>
            <div className="secure-label"><i className="bi bi-shield-check" /> Secure</div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-start" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2 mt-1" />
              <span>{error}</span>
            </div>
          )}

          {loadingCurrencies ? (
            <div className="loading-panel" role="status">
              <div className="spinner-border" aria-hidden="true" />
              <span>Loading supported currencies…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="amount" className="form-label">Amount</label>
                <div className="amount-input input-group input-group-lg">
                  <span className="input-group-text">{selectedFrom?.symbol || from}</span>
                  <input
                    id="amount"
                    className="form-control"
                    type="number"
                    min="0.000001"
                    step="any"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value); setResult(null); }}
                    aria-describedby="amount-help"
                    required
                  />
                </div>
                <span id="amount-help" className="visually-hidden">Enter a positive amount to convert</span>
              </div>

              <div className="currency-grid">
                <CurrencySelect id="from-currency" label="From" value={from} currencies={currencies} onChange={(value) => { setFrom(value); setResult(null); }} />
                <button className="swap-button" type="button" onClick={swapCurrencies} aria-label="Swap currencies" title="Swap currencies">
                  <i className="bi bi-arrow-left-right" />
                </button>
                <CurrencySelect id="to-currency" label="To" value={to} currencies={currencies} onChange={(value) => { setTo(value); setResult(null); }} />
              </div>

              <div className="historical-box">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="historical-toggle"
                    checked={useHistorical}
                    onChange={(event) => { setUseHistorical(event.target.checked); setResult(null); }}
                  />
                  <label className="form-check-label" htmlFor="historical-toggle">
                    <span className="fw-semibold">Use a historical rate</span>
                    <small>Travel back to a previous market day</small>
                  </label>
                </div>
                {useHistorical && (
                  <div className="date-field mt-3">
                    <label className="form-label" htmlFor="rate-date">Exchange rate date</label>
                    <input
                      className="form-control"
                      id="rate-date"
                      type="date"
                      min="1999-01-01"
                      max={yesterday}
                      value={date}
                      onChange={(event) => { setDate(event.target.value); setResult(null); }}
                      required
                    />
                  </div>
                )}
              </div>

              <button className="btn convert-button w-100" type="submit" disabled={converting || currencies.length === 0}>
                {converting ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> Converting…</> : <>Convert now <i className="bi bi-arrow-right ms-2" /></>}
              </button>
            </form>
          )}

          {result && (
            <div className="result-panel" aria-live="polite">
              <p className="result-source mb-2">{formatMoney(result.amount, result.from)} equals</p>
              <p className="result-value mb-2">{formatMoney(result.result, result.to)}</p>
              <p className="result-rate mb-0">1 {result.from} = {result.rate.toLocaleString(undefined, { maximumFractionDigits: 8 })} {result.to} · {result.date ? result.date : 'Latest available rate'}</p>
            </div>
          )}
        </section>

        <HistoryList items={history} onClear={() => setHistory([])} formatMoney={formatMoney} />

        <footer className="footer text-center">
          <i className="bi bi-info-circle me-2" /> Rates are supplied by FreeCurrencyAPI and may differ from provider rates.
        </footer>
      </main>
    </div>
  );
}

export default App;


