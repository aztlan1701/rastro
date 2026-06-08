interface LayerToggleButtonProps {
  open: boolean;
  onToggle: () => void;
}

export function LayerToggleButton({ open, onToggle }: LayerToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="layer-panel"
      aria-label="Capas del mapa"
      title="Capas del mapa (L)"
      className="absolute top-3 left-3 z-20 flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 bg-[#030508]/95 text-[#c0bfb8] backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </button>
  );
}
