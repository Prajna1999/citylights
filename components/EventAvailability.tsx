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

export default function EventAvailability({
  shopName,
  whatsapp,
  bookedDates = [],
}: {
  shopName: string;
  whatsapp: string | null;
  bookedDates?: string[];
}) {
  const today = new Date();
  const todayIso = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

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

  const message = `Hi, I'd like to check availability for ${shopName}${selected ? ` on ${formatDate(selected)}` : ""}.`;
  const href = whatsapp && selected ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="availability">
      <p className="eyebrow">Check availability</p>
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
            const isPast = iso < todayIso;
            const isBooked = bookedDates.includes(iso);
            const classes = ["bdc-cell"];
            if (isBooked) classes.push("unavailable");
            if (iso === selected) classes.push("selected");
            if (iso === todayIso) classes.push("today");
            return (
              <button
                type="button"
                key={iso}
                className={classes.join(" ")}
                disabled={isPast || isBooked}
                aria-pressed={iso === selected}
                onClick={() => setSelected(iso === selected ? null : iso)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <div className="availability-legend">
        <span><i className="avail-dot available" /> Available</span>
        <span><i className="avail-dot booked" /> Already booked</span>
      </div>
      {selected ? (
        href ? (
          <a className="secondary-action" href={href} target="_blank" rel="noreferrer">Ask about {formatDate(selected)} <span>↗</span></a>
        ) : (
          <p className="hint">Add a WhatsApp number to let customers ask about this date directly.</p>
        )
      ) : (
        <p className="hint">Tap an available date to ask about it on WhatsApp.</p>
      )}
    </div>
  );
}
