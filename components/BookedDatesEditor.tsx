"use client";

import { useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BookedDatesEditor({
  name,
  dates: controlledDates,
  onChange,
  initialDates = [],
}: {
  /** When set, renders a hidden input under this name — for embedding in a plain server-rendered <form>. */
  name?: string;
  /** Controlled usage (e.g. inside another client component's state). */
  dates?: string[];
  onChange?: (dates: string[]) => void;
  /** Starting value for uncontrolled (name-based) usage. */
  initialDates?: string[];
}) {
  const [internalDates, setInternalDates] = useState<string[]>(initialDates);
  const dates = controlledDates ?? internalDates;
  const setDates = onChange ?? setInternalDates;

  const today = new Date();
  const todayIso = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const toggle = (iso: string) => {
    setDates(dates.includes(iso) ? dates.filter((date) => date !== iso) : [...dates, iso].sort());
  };

  const changeMonth = (delta: number) => {
    let month = viewMonth + delta;
    let year = viewYear;
    if (month < 0) { month = 11; year -= 1; }
    if (month > 11) { month = 0; year += 1; }
    setViewMonth(month);
    setViewYear(year);
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="booked-dates">
      <div className="booked-dates-cal">
        <div className="bdc-head">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <strong>{MONTH_NAMES[viewMonth]} {viewYear}</strong>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
        </div>
        <div className="bdc-weekdays">{WEEKDAYS.map((weekday, index) => <span key={index}>{weekday}</span>)}</div>
        <div className="bdc-grid">
          {cells.map((day, index) => {
            if (day === null) return <span className="bdc-cell empty" key={`empty-${index}`} />;
            const iso = toISODate(viewYear, viewMonth, day);
            const selected = dates.includes(iso);
            const isPast = iso < todayIso;
            const classes = ["bdc-cell"];
            if (selected) classes.push("selected");
            if (iso === todayIso) classes.push("today");
            return (
              <button type="button" key={iso} className={classes.join(" ")} onClick={() => toggle(iso)} disabled={isPast}>
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <p className="hint">Click any dates on the calendar — pick as many as you like — to mark them booked. Customers will see those dates as unavailable.</p>
      {dates.length > 0 && (
        <ul className="booked-dates-list">
          {dates.map((date) => (
            <li key={date}>
              <span>{formatDate(date)}</span>
              <button type="button" onClick={() => toggle(date)} aria-label={`Remove ${date}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {name && <input type="hidden" name={name} value={dates.join("\n")} />}
    </div>
  );
}
