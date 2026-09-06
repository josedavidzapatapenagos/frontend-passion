type AppIconProps = {
  name:
    | "success"
    | "info"
    | "warning"
    | "error"
    | "check"
    | "clock"
    | "pause"
    | "close"
    | "shield";
  className?: string;
};

const iconClass = "h-5 w-5";

export const AppIcon = ({ name, className = iconClass }: AppIconProps) => {
  if (name === "success" || name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "info") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "warning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M12 4l9 16H3L12 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "error" || name === "close") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "pause") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="7" y="6" width="3" height="12" rx="1.5" fill="currentColor" />
        <rect x="14" y="6" width="3" height="12" rx="1.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3l7 4v5c0 4.2-2.5 8.1-7 9-4.5-.9-7-4.8-7-9V7l7-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};