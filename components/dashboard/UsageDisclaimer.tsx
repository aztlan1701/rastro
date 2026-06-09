"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { USAGE_DISCLAIMER } from "@/lib/source-catalog";

const STORAGE_KEY = "RASTRO_DISCLAIMER_COLLAPSED";

export function UsageDisclaimer() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div
      role="note"
      className="shrink-0 border-b border-white/6 bg-white/[0.02] px-4 py-2.5 text-[11px] leading-relaxed text-[#556070]"
    >
      <div className="flex items-start justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="flex-1 text-left"
        >
          <span className="text-[#888]">Aviso de uso</span>
          {collapsed ? (
            <span className="ml-2 text-[#3a4558]">(tocar para expandir)</span>
          ) : (
            <span className="mt-1 block">{USAGE_DISCLAIMER}</span>
          )}
        </button>
        {!collapsed ? (
          <Link
            href="/metodologia"
            className="shrink-0 text-[#4a9eff] underline decoration-white/10 underline-offset-2"
          >
            Más
          </Link>
        ) : null}
      </div>
      <div className="hidden lg:block">
        <span className="text-[#888]">Aviso de uso:</span> {USAGE_DISCLAIMER}{" "}
        <Link
          href="/metodologia"
          className="text-[#4a9eff] underline decoration-white/10 underline-offset-2"
        >
          Más información
        </Link>
      </div>
    </div>
  );
}
