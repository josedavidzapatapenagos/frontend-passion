type Props = {
  rows?: number;
  className?: string;
};

export const SkeletonLoader = ({ rows = 3, className = "" }: Props) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-14 rounded-2xl bg-slate-200/80 dark:bg-white/10"
        />
      ))}
    </div>
  );
};