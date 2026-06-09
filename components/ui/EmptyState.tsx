interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[#556070]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </svg>
      </div>
      <h3 className="text-[11px] font-medium tracking-wide text-[#888]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-[#556070]">{description}</p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-sm border border-white/10 px-3 py-1.5 text-[11px] tracking-wide text-[#c0bfb8] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
