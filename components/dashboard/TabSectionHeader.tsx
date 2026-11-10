interface TabSectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function TabSectionHeader({ title, subtitle, className = "mb-5" }: TabSectionHeaderProps) {
  return (
    <div className={className}>
      <h2 className="font-display text-lg font-bold text-ink-strong">{title}</h2>
      {subtitle ? <p className="mt-1 text-[11px] text-muted">{subtitle}</p> : null}
    </div>
  );
}
