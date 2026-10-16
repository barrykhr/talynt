/** Small service glyphs. Decorative: every use carries its own text label. */

export function LinkedInIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6.4" y="10" width="2.4" height="7.6" fill="currentColor" />
      <circle cx="7.6" cy="7.2" r="1.45" fill="currentColor" />
      <path
        d="M11 10h2.3v1.1c.4-.7 1.3-1.3 2.6-1.3 2.2 0 2.8 1.4 2.8 3.4v4.4h-2.4v-3.9c0-1-.2-1.8-1.2-1.8s-1.7.7-1.7 1.9v3.8H11Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 7.9c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.5.4 1 .6 1.4.8.2.1.4 0 .5-.1l.7-.8c.2-.2.3-.2.6-.1l1.6.8c.3.1.4.2.4.4 0 .5-.1 1.1-.6 1.5-.5.4-1.2.7-2 .6-1.2-.1-2.7-.8-4.1-2.1-1.4-1.3-2.3-2.8-2.5-4-.1-.9.2-1.6.5-2.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
