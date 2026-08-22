export default function TrinityMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 66 54" role="img" aria-label="Lord Jagannath, Balabhadra and Subhadra">
      {/* Balabhadra — white */}
      <g>
        <rect x="3" y="11" width="18" height="41" rx="9" fill="#fdfaf3" stroke="#262019" strokeWidth="1.5" />
        <circle cx="9" cy="23" r="2.5" fill="#262019" />
        <circle cx="15" cy="23" r="2.5" fill="#262019" />
        <rect x="7.5" y="39" width="9" height="8" rx="3.5" fill="#ad3d1f" />
      </g>
      {/* Subhadra — yellow, between */}
      <g>
        <rect x="24" y="19" width="14" height="33" rx="7" fill="#d9a441" stroke="#262019" strokeWidth="1.5" />
        <circle cx="29" cy="30" r="2.1" fill="#262019" />
        <circle cx="33" cy="30" r="2.1" fill="#262019" />
      </g>
      {/* Jagannath — black */}
      <g>
        <rect x="41" y="7" width="20" height="45" rx="10" fill="#262019" />
        <circle cx="47.5" cy="19.5" r="2.7" fill="#f7f3ec" />
        <circle cx="54.5" cy="19.5" r="2.7" fill="#f7f3ec" />
        <rect x="46" y="36" width="10" height="9" rx="4" fill="#ad3d1f" />
      </g>
    </svg>
  );
}
