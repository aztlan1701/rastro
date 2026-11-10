"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { USAGE_DISCLAIMER } from "@/lib/source-catalog";

const STORAGE_KEY = "RASTRO_DISCLAIMER_COLLAPSED";

const subscribeNoop = () => () => {};

function readStoredCollapsed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const readStoredCollapsedOnServer = () => false;

export function UsageDisclaimer() {
  const storedCollapsed = useSyncExternalStore(
    subscribeNoop,
    readStoredCollapsed,
    readStoredCollapsedOnServer,
  );
  // null until the user toggles; until then the stored value decides.
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const collapsed = userCollapsed ?? storedCollapsed;

  const toggle = () => {
    const next = !collapsed;
    setUserCollapsed(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="note"
      className="shrink-0 border-b border-edge/10 bg-surface px-4 py-2.5 text-[11px] leading-relaxed text-muted"
    >
      <div className="flex items-start justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="flex-1 text-left"
        >
          <span className="text-ink-4">Aviso de uso</span>
          {collapsed ? (
            <span className="ml-2 text-faint">(tocar para expandir)</span>
          ) : (
            <span className="mt-1 block">{USAGE_DISCLAIMER}</span>
          )}
        </button>
        {!collapsed ? (
          <Link
            href="/metodologia"
            className="shrink-0 text-[#1f6fd0] underline decoration-edge/30 underline-offset-2"
          >
            Más
          </Link>
        ) : null}
      </div>
      <div className="hidden lg:block">
        <span className="text-ink-4">Aviso de uso:</span> {USAGE_DISCLAIMER}{" "}
        <Link
          href="/metodologia"
          className="text-[#1f6fd0] underline decoration-edge/30 underline-offset-2"
        >
          Más información
        </Link>
      </div>
    </div>
  );
}
