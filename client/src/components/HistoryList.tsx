import type { HistoryItem } from '../types';

interface Props {
  items: HistoryItem[];
  onClear: () => void;
  formatMoney: (value: number, currency: string) => string;
}

export function HistoryList({ items, onClear, formatMoney }: Props) {
  return (
    <section className="history-section" aria-labelledby="history-title">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div><p className="eyebrow mb-1">Saved locally</p><h2 id="history-title" className="h5 mb-0">Recent conversions</h2></div>
        {items.length > 0 && <button type="button" className="btn btn-link clear-button p-1" onClick={onClear}>Clear all</button>}
      </div>
      {items.length === 0 ? (
        <div className="empty-state"><i className="bi bi-clock-history" /><p className="mb-1 fw-semibold">No conversions yet</p><span>Your completed conversions will appear here.</span></div>
      ) : (
        <div className="history-list">{items.map((item) => (
          <article className="history-item" key={item.id}>
            <span className="history-icon" aria-hidden="true"><i className="bi bi-arrow-up-right" /></span>
            <div className="min-width-0 flex-grow-1">
              <div className="history-values"><strong>{formatMoney(item.amount, item.from)}</strong><i className="bi bi-arrow-right" /><strong>{formatMoney(item.result, item.to)}</strong></div>
              <div className="history-meta"><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))}</time><span className="dot">•</span><span>{item.date ? `Rate from ${item.date}` : 'Live rate'}</span></div>
            </div>
          </article>
        ))}</div>
      )}
    </section>
  );
}
