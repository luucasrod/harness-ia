type ProgressBarProps = {
  value: number;
  label?: string;
  size?: 'sm' | 'md';
};

export default function ProgressBar({
  value,
  label,
  size = 'md',
}: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  const heightClass = size === 'sm' ? 'h-2' : 'h-3';

  return (
    <div className="w-full">
      {label ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm text-[#A0A0A0]">
          <span>{label}</span>
          <span className="font-bold text-white">{safeValue}%</span>
        </div>
      ) : null}
      <div
        className={`${heightClass} overflow-hidden rounded-full bg-[#1A1D25]`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
        aria-label={label ?? 'Progresso'}
      >
        <div
          className={`${heightClass} rounded-full bg-[#0066FF] transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
