"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { KnowledgeInput, KnowledgeSection } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Button from "./ui/Button";
import Chip from "./ui/Chip";
import { Field, TextArea, TextInput } from "./ui/Field";
import { HowItWorks, InfoBox } from "./ui/Help";
import { PlusIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";

/** The same cap the API enforces on all enabled sections together. */
const MAX_TOTAL = 24_000;
const EMPTY: KnowledgeInput = { slug: "", titleHe: "", contentHe: "", enabled: true, sortOrder: 100 };

function toInput(section: KnowledgeSection): KnowledgeInput {
  return { slug: section.slug, titleHe: section.titleHe, contentHe: section.contentHe, enabled: section.enabled, sortOrder: section.sortOrder };
}

/** What Fitbot knows about FitFam, written by the coaches: sections of plain text added to its instructions on every message. */
export default function FitbotPage() {
  const { onSessionLost } = useAdminSession();
  const [sections, setSections] = useState<KnowledgeSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // null = closed, "new" = adding, otherwise the section being edited
  const [editing, setEditing] = useState<KnowledgeSection | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onSessionLost();
        return;
      }
      setError(describeError(e));
    },
    [onSessionLost],
  );

  const reload = useCallback(() => {
    api
      .listKnowledge()
      .then((data) => {
        setSections(data);
        setError(null);
      })
      .catch(handleError);
  }, [handleError]);

  useEffect(() => {
    let cancelled = false;
    api
      .listKnowledge()
      .then((data) => {
        if (!cancelled) setSections(data);
      })
      .catch((e) => {
        if (!cancelled) handleError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const used = useMemo(() => (sections ?? []).filter((s) => s.enabled).reduce((sum, s) => sum + s.contentHe.length, 0), [sections]);

  const toggle = async (section: KnowledgeSection) => {
    try {
      await api.updateKnowledge(section.id, { ...toInput(section), enabled: !section.enabled });
      reload();
    } catch (e) {
      handleError(e);
    }
  };

  const remove = async (section: KnowledgeSection) => {
    setDeleting(null);
    try {
      await api.deleteKnowledge(section.id);
      reload();
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <>
      <PageHeader
        title="Fitbot"
        description="מה Fitbot, העוזר החכם באפליקציה, יודע על FitFam ואיך הוא מדבר. כל חלק פעיל נכנס להוראות שלו בכל הודעה."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <PlusIcon />
            חלק חדש
          </Button>
        }
      />

      <HowItWorks id="fitbot">
        <p>Fitbot עונה ללקוחות לפי שלושה מקורות: <b>הנתונים של הלקוח</b> (התוכנית, הרמה, ההתקדמות), <b>האימונים והתרגילים</b> שאתם כותבים בבנק ובתוכניות, ו<b>הטקסטים שבדף הזה</b>.</p>
        <ol className="list-decimal ps-6">
          <li>כל חלק הוא טקסט חופשי בעברית: מי אנחנו, איך מדברים, עקרונות האימון, חוקי האפליקציה, שאלות נפוצות.</li>
          <li>כתבו <b>עובדות ישירות</b>. מה שלא כתוב כאן ולא באימונים, Fitbot אמור להגיד שהוא לא יודע.</li>
          <li>שינוי נכנס לתוקף מיד, בשיחה הבאה. אפשר לכבות חלק בלי למחוק אותו.</li>
          <li>כדי לבדוק איך זה נשמע, פתחו את Fitbot באפליקציה ושאלו שאלה.</li>
        </ol>
        <InfoBox tone="warn" title="לא כותבים כאן">
          פרטים אישיים של לקוחות, סיסמאות או מידע סודי. הטקסט נשלח לספק הבינה המלאכותית עם כל הודעה.
        </InfoBox>
      </HowItWorks>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3">
        <span className="text-body-md text-text-secondary">גודל החלקים הפעילים</span>
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
          <div className={`h-full rounded-full ${used > MAX_TOTAL * 0.9 ? "bg-ember" : "bg-volt"}`} style={{ width: `${Math.min(100, (used / MAX_TOTAL) * 100)}%` }} />
        </div>
        <span dir="ltr" className="text-body-md font-semibold tabular-nums">
          {used.toLocaleString("en-US")} / {MAX_TOTAL.toLocaleString("en-US")}
        </span>
      </div>

      {editing && (
        <SectionForm
          key={editing === "new" ? "new" : editing.id}
          section={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onSessionLost={onSessionLost}
        />
      )}

      {error && (
        <p role="alert" className="text-body-md text-ember">
          {error}
        </p>
      )}
      {!sections && !error && <p className="text-body-md text-text-muted">טוען...</p>}
      {sections && sections.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-body-lg text-text-secondary">עוד אין חלקים. הוסיפו את הראשון.</p>
      )}

      {sections && sections.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sections.map((section) => (
            <li key={section.id} className={`flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 ${section.enabled ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-heading text-headline-sm font-bold">{section.titleHe}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip tone={section.enabled ? "volt" : "neutral"}>{section.enabled ? "פעיל" : "כבוי"}</Chip>
                    <Chip>{section.contentHe.length.toLocaleString("en-US")} תווים</Chip>
                  </div>
                </div>
                {deleting === section.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-body-md text-text-secondary">למחוק לצמיתות?</span>
                    <Button size="sm" onClick={() => void remove(section)}>
                      מחיקה
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(null)}>
                      ביטול
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(section)}>
                      עריכה
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void toggle(section)}>
                      {section.enabled ? "כיבוי" : "הפעלה"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(section.id)}>
                      מחיקה
                    </Button>
                  </div>
                )}
              </div>
              <p className="line-clamp-3 whitespace-pre-line text-body-md leading-6 text-text-secondary">{section.contentHe}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SectionForm({ section, onCancel, onSaved, onSessionLost }: { section: KnowledgeSection | null; onCancel: () => void; onSaved: () => void; onSessionLost: () => void }) {
  const [form, setForm] = useState<KnowledgeInput>(section ? toInput(section) : EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof KnowledgeInput>(key: K, value: KnowledgeInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.titleHe.trim() || !form.contentHe.trim()) {
      setError("יש למלא כותרת וטקסט.");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(form.slug.trim().toLowerCase())) {
      setError("המזהה יכול להכיל רק אותיות קטנות באנגלית, ספרות ומקף (למשל: faq-2).");
      return;
    }
    setBusy(true);
    try {
      const input = { ...form, slug: form.slug.trim().toLowerCase(), titleHe: form.titleHe.trim() };
      await (section ? api.updateKnowledge(section.id, input) : api.createKnowledge(input));
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onSessionLost();
        return;
      }
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="animate-rise flex flex-col gap-5 rounded-2xl border border-ember/40 bg-surface p-6">
      <h2 className="font-heading text-headline-md font-bold">{section ? "עריכת חלק" : "חלק חדש"}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="כותרת" htmlFor="kn-title" help="השם שמופיע ברשימה וגם ל-Fitbot ככותרת של החלק.">
          <TextInput id="kn-title" value={form.titleHe} maxLength={120} onChange={(e) => set("titleHe", e.target.value)} placeholder="למשל: שאלות נפוצות" />
        </Field>
        <Field label="מזהה" htmlFor="kn-slug" hint="אנגלית קטנה, ספרות ומקף. לא מוצג ללקוחות." help="שם קצר ייחודי לחלק. אין צורך לשנות אותו אחרי שיצרתם.">
          <TextInput id="kn-slug" dir="ltr" value={form.slug} maxLength={40} onChange={(e) => set("slug", e.target.value)} placeholder="faq" />
        </Field>
      </div>

      <Field
        label="הטקסט"
        htmlFor="kn-content"
        hint={`${form.contentHe.length.toLocaleString("en-US")} / 12,000 תווים`}
        help="כתבו כמו שמסבירים לעוזר חדש בצוות: עובדות, כללים, ודוגמאות לאיך עונים. אפשר שורות קצרות עם מקף. אל תכתבו מידע שלא נכון או משהו שאתם לא רוצים שיגידו ללקוחות."
      >
        <TextArea id="kn-content" value={form.contentHe} maxLength={12000} rows={14} onChange={(e) => set("contentHe", e.target.value)} />
      </Field>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-body-md">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} className="size-4 accent-ember" />
          פעיל (נכנס להוראות של Fitbot)
        </label>
        <Field label="סדר" htmlFor="kn-order" hint="מספר נמוך מופיע קודם." className="w-32">
          <TextInput id="kn-order" type="number" dir="ltr" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-body-md text-ember">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "שומר..." : "שמירה"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
