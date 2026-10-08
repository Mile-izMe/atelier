interface AtelierIconProps {
  className?: string;
}

export default function AtelierIcon({ className }: AtelierIconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 19 12 5l7 14" />
      <path d="M8 13h8" />
      <path d="M4 20h16" />
    </svg>
  );
}
