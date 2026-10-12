"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/** A coloured call-out for something worth reading: a tip, a warning, a rule. */
export function InfoBox({
  title,
  tone = "info",
  children,
}: {
  title?: string;
  tone?: "info" | "warn" | "ok";
  children: ReactNode;
}) {
  const tones = {
    info: "border-info/30 bg-info/10",
    warn: "border-ember/40 bg-ember/10",
    ok: "border-volt/30 bg-volt/10",
  };
  const titleTones = { info: "text-info", warn: "text-ember", ok: "text-volt" };
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      {title && <p className={`text-body-md font-bold ${titleTones[tone]}`}>{title}</p>}
      <div className="text-body-md leading-6 text-text-primary">{children}</div>
    </div>
  );
}

/** An example written the way it should be typed into the system, set apart so it is easy to copy. */
export function Example({ label = "דוגמה", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-well px-4 py-3">
      <p className="mb-1 text-label-md font-semibold text-text-muted">{label}</p>
      <div className="whitespace-pre-line text-body-md leading-6 text-text-primary">{children}</div>
    </div>
  );
}

/**
 * The "how does this page work" panel at the top of a page. It starts open the first time, remembers if you closed it
 * (on this device only), and always has a link to the full guide.
 */
export function HowItWorks({
  id,
  title = "איך זה עובד",
  guideHref,
  children,
}: {
  id: string;
  title?: string;
  guideHref?: string;
  children: ReactNode;
}) {
  const key = `ums.help.${id}`;
  const [open, setOpen] = useState(true);

  // read the remembered choice once the page is in the browser
  useEffect(() => {
    let closed = false;
    try {
      closed = window.localStorage.getItem(key) === "closed";
    } catch {
      // storage can be blocked: the panel just starts open
    }
    const frame = requestAnimationFrame(() => setOpen(!closed));
    return () => cancelAnimationFrame(frame);
  }, [key]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(key, next ? "open" : "closed");
    } catch {
      // not remembering is fine
    }
  };

  return (
    <section className="rounded-2xl border border-info/30 bg-info/[0.07]">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span className="flex items-center gap-2.5 font-heading text-body-lg font-bold text-info">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-info text-[13px] font-bold text-canvas">
            ?
          </span>
          {title}
        </span>
        <span className="text-body-md text-text-secondary">{open ? "הסתרה" : "הצגה"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-info/20 px-5 pb-5 pt-4 text-body-md leading-7 text-text-primary">
          {children}
          {guideHref && (
            <p>
              <Link href={guideHref} className="font-semibold text-info underline-offset-4 hover:underline">
                למדריך המלא ←
              </Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
