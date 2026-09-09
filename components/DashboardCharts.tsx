export type BarRow = { label: string; value: number; color?: string };

export function BarChart({ title, rows, note }: { title: string; rows: BarRow[]; note?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="chart-card">
      <div className="chart-head">
        <span>{title}</span>
        {note && <small>{note}</small>}
      </div>
      <div className="bar-chart">
        {rows.map((row) => (
          <div className="bar-row" key={row.label}>
            <span className="bar-label">{row.label}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(row.value / max) * 100}%`, background: row.color ?? "var(--accent)" }} />
            </span>
            <span className="bar-value">{row.value}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="chart-empty">No data yet.</p>}
      </div>
    </div>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({ title, segments, note }: { title: string; segments: DonutSegment[]; note?: string }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = total ? (cursor / total) * 360 : 0;
    cursor += segment.value;
    const end = total ? (cursor / total) * 360 : 0;
    return `${segment.color} ${start}deg ${end}deg`;
  });
  const gradient = total ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#e6ddcb 0deg 360deg)";

  return (
    <div className="chart-card">
      <div className="chart-head">
        <span>{title}</span>
        {note && <small>{note}</small>}
      </div>
      <div className="donut-chart">
        <div className="donut-ring" style={{ background: gradient }}>
          <div className="donut-center">
            <strong>{total}</strong>
            <small>total</small>
          </div>
        </div>
        <div className="donut-legend">
          {segments.map((segment) => (
            <span className="donut-legend-item" key={segment.label}>
              <i className="legend-dot" style={{ background: segment.color }} />
              {segment.label}
              <b>{segment.value}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
