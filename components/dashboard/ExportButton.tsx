"use client";

import { downloadTextFile } from "@/lib/export/csv";

interface ExportButtonProps {
  label: string;
  filename: string;
  content: string;
  mimeType?: string;
}

export function ExportButton({ label, filename, content, mimeType }: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={() => downloadTextFile(filename, content, mimeType)}
      className="rounded-sm border border-white/10 px-2.5 py-1 text-[11px] tracking-wide text-[#aaa] transition-colors hover:bg-white/5"
    >
      {label}
    </button>
  );
}
