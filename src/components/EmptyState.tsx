type Props = {
  title: string;
  description: string;
};

export const EmptyState = ({ title, description }: Props) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-slate-700 dark:border-white/20 dark:bg-white/5 dark:text-white/80">
      <p className="font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-2 text-sm opacity-85">{description}</p>
    </div>
  );
};