/**
 * Lucide v1 dropped third-party brand glyphs, so the two social marks the
 * footer needs are drawn here. Both inherit `currentColor`.
 */

type IconProps = { size?: number; className?: string };

export function InstagramIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TelegramIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21.5 3.5 2.8 10.7c-.8.3-.8 1.4 0 1.7l4.6 1.5 1.7 5.1c.2.7 1.1.9 1.6.3l2.4-2.6 4.6 3.4c.6.4 1.4.1 1.6-.6l3-14.2c.2-.8-.6-1.5-1.3-1.2Z" />
      <path d="m7.4 13.9 10.7-7.6-8.4 8.9" />
    </svg>
  );
}
