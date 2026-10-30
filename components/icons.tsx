/** Shared inline icons. All inherit currentColor and sit on a 24×24 grid. */

export const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6.5 3.5 9 3l2 4.5-2 1.5c.8 2 2.5 3.7 4.5 4.5l1.5-2 4.5 2-.5 2.5c-.3 1.4-1.6 2.3-3 2C11 19 5 13 5 6.5c-.3-1.4.6-2.7 2-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5h16v11H7l-3 3V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

/** The WhatsApp glyph — the recognisable handset-in-a-speech-bubble, filled so
 *  it reads correctly at small sizes and on a coloured button. */
export const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2.06 22l5.35-1.4a9.8 9.8 0 0 0 4.63 1.18h.01c5.43 0 9.84-4.4 9.84-9.84 0-2.63-1.02-5.1-2.88-6.96A9.78 9.78 0 0 0 12.04 2Zm0 1.8c2.15 0 4.17.84 5.69 2.36a7.98 7.98 0 0 1 2.36 5.68c0 4.44-3.61 8.04-8.05 8.04a8.05 8.05 0 0 1-4.1-1.12l-.29-.18-3.05.8.81-2.97-.19-.31a7.96 7.96 0 0 1-1.22-4.26c0-4.44 3.61-8.04 8.04-8.04Z" />
    <path d="M9.3 7.03c-.18-.4-.36-.41-.53-.42h-.45c-.16 0-.4.06-.62.29-.21.23-.81.79-.81 1.93s.83 2.24.95 2.39c.12.16 1.6 2.57 3.96 3.5 1.96.77 2.36.62 2.79.58.42-.04 1.37-.56 1.56-1.1.2-.54.2-1 .14-1.1-.06-.1-.22-.15-.45-.27-.24-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.16.23-.6.75-.73.9-.14.16-.27.18-.5.06-.24-.12-.99-.36-1.89-1.16-.7-.62-1.17-1.39-1.3-1.62-.14-.24-.02-.36.1-.48.1-.1.23-.27.35-.41.11-.14.15-.24.23-.4.08-.16.04-.3-.02-.42-.06-.12-.51-1.27-.72-1.73Z" />
  </svg>
);

export const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="17" cy="7" r="1.2" fill="currentColor" />
  </svg>
);

export const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="m3.8 6.5 8.2 6 8.2-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const CateringIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 13a8 8 0 0 1 16 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M2.5 13h19M12 5V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M5 17h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Google "G", drawn in the brand's four colours. */
export const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.57-5.17 3.57-8.87Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
    />
  </svg>
);

/** Five stars with `rating` of them filled. */
export const StarRow = ({ rating }: { rating: number }) => (
  <span className="stars" role="img" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <svg key={n} viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path
          d="m12 2.6 2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.95L12 2.6Z"
          fill={n <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ))}
  </span>
);
