"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FIELD_HELP, MEASURE_HELP, STYLE_HELP, TROUBLESHOOTING } from "@/lib/help";
import type { BlockStyle } from "@/lib/types";
import { MEASURES, MEASURE_LABELS, STYLE_LABELS } from "@/lib/training";

const BLOCK_STYLES = Object.keys(STYLE_LABELS) as BlockStyle[];
import { Example, InfoBox } from "./ui/Help";
import PageHeader from "./ui/PageHeader";

const SECTIONS = [
  { id: "flow", label: "סדר העבודה" },
  { id: "exercises", label: "בנק תרגילים" },
  { id: "workouts", label: "בניית אימון" },
  { id: "publishing", label: "סדר ופרסום" },
  { id: "customer", label: "מה הלקוח רואה" },
  { id: "customers", label: "לקוחות ורשימת המתנה" },
  { id: "troubleshooting", label: "הודעות שגיאה" },
  { id: "glossary", label: "מילון" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-heading text-headline-md font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body-lg font-bold">{title}</h3>
      <div className="flex flex-col gap-2 text-body-md leading-7 text-text-secondary">{children}</div>
    </div>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-1.5 ps-6 text-body-md leading-7">{children}</ol>;
}

/** The full coach guide: everything needed to build and publish programs, in plain language. */
export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="מדריך למאמנים"
        description="כל מה שצריך כדי לבנות תוכניות אימון במערכת: מה כל דבר עושה, איך ממלאים כל שדה, ומה הלקוח רואה בסוף."
      />

      <nav aria-label="תוכן עניינים" className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-border bg-surface px-4 py-2 text-body-md font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <Section id="flow" title="סדר העבודה: מאפס לאימון שהלקוח רואה">
        <p className="text-body-md leading-7 text-text-secondary">
          המערכת בנויה בשכבות. כל <b>תוכנית</b> מחולקת ל<b>רמות</b>, בכל רמה יש <b>אימונים</b> בסדר קבוע, ובסוף כל רמה
          יש <b>אתגר מעבר רמה</b>. האימונים בנויים מ<b>תרגילים</b> שנמצאים ב<b>בנק התרגילים</b>.
        </p>
        <Steps>
          <li>
            <b>בנק תרגילים:</b> מוסיפים כל תרגיל שתצטרכו, פעם אחת (<Link className="text-info underline" href="/exercises">בנק תרגילים</Link>).
          </li>
          <li>
            <b>תוכניות:</b> בוחרים תוכנית ורמה (<Link className="text-info underline" href="/plans">תוכניות</Link>), ולוחצים על הרמה.
          </li>
          <li>
            <b>אימון חדש:</b> ממלאים שם, ענף, ומוסיפים מקטעים, בלוקים ותרגילים עם המספרים. שומרים כטיוטה.
          </li>
          <li>
            <b>בדיקה:</b> לוחצים ״שמירה ותצוגת שלבים״ ורואים בדיוק מה הלקוח יעבור בליווי.
          </li>
          <li>
            <b>סדר:</b> גוררים את האימון למקום הנכון ברשימת הרמה.
          </li>
          <li>
            <b>פרסום:</b> רק אימון מפורסם נראה ללקוחות. עד אז הוא טיוטה.
          </li>
          <li>
            <b>אתגר:</b> מוסיפים לרמה אימון מסוג אתגר מעבר רמה. הוא תמיד אחרון.
          </li>
        </Steps>
        <InfoBox title="כלל חשוב" tone="warn">
          לכל רמה צריך אתגר מפורסם. בלי אתגר מפורסם לקוח שסיים את אימוני הרמה לא יכול להמשיך לרמה הבאה.
        </InfoBox>
        <InfoBox title="כל מסך מסביר את עצמו" tone="info">
          בראש כל מסך יש לוח ״איך זה עובד״ (אפשר לסגור אותו, והוא זוכר). ליד כל שדה בטופס יש כפתור <b>?</b> שמסביר מה
          לכתוב בו.
        </InfoBox>
      </Section>

      <Section id="exercises" title="בנק התרגילים">
        <p className="text-body-md leading-7 text-text-secondary">
          תרגיל נכתב פעם אחת ומשמש באימונים רבים. אם תשנו תרגיל, השינוי יופיע בכל האימונים שמשתמשים בו. אי אפשר למחוק
          תרגיל, רק להעביר לארכיון (הוא נעלם מהבחירה לאימונים חדשים, אבל נשאר במקומות שכבר משתמשים בו).
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Sub title="שם התרגיל">{FIELD_HELP.exerciseName}</Sub>
          <Sub title="ענף">{FIELD_HELP.exerciseSport}</Sub>
          <Sub title="ציוד ושרירים">{FIELD_HELP.equipment} {FIELD_HELP.muscles}</Sub>
          <Sub title="קישור לסרטון">{FIELD_HELP.video}</Sub>
        </div>

        <Sub title="איך מודדים את התרגיל">
          <p>
            זו ההחלטה החשובה ביותר בתרגיל, כי היא קובעת אילו מספרים תמלאו בו באימון. אחרי שתרגיל משמש באימון אי אפשר
            לשנות לו את סוג המדידה.
          </p>
        </Sub>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-start text-body-md">
            <thead>
              <tr className="border-b border-border text-label-md text-text-muted">
                <th className="py-2 pe-4 text-start">סוג</th>
                <th className="py-2 pe-4 text-start">מה זה</th>
                <th className="py-2 pe-4 text-start">מה תמלאו באימון</th>
                <th className="py-2 text-start">דוגמאות</th>
              </tr>
            </thead>
            <tbody className="align-top leading-6">
              {MEASURES.map((measure) => (
                <tr key={measure} className="border-b border-border/60">
                  <td className="py-2.5 pe-4 font-semibold">{MEASURE_LABELS[measure]}</td>
                  <td className="py-2.5 pe-4 text-text-secondary">{MEASURE_HELP[measure].what}</td>
                  <td className="py-2.5 pe-4 text-text-secondary">{MEASURE_HELP[measure].asks}</td>
                  <td className="py-2.5 text-text-secondary">{MEASURE_HELP[measure].example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Sub title="תיאור ודגשים: שורה אחת לכל שלב">
          <p>
            בשני התיבות האלה כל <b>שורה</b> (Enter) היא פריט נפרד. בתיאור, כל שורה הופכת לשלב ממוספר. בדגשים, כל שורה
            הופכת לנקודה עם וי. מתחת לתיבות יש תצוגה מקדימה חיה שמראה איך הלקוח יראה את זה.
          </p>
        </Sub>
        <Example label="כך כותבים (תיאור)">
          {"עומדים עם הרגליים ברוחב הכתפיים.\nמורידים את הישבן אחורה ולמטה.\nדוחפים דרך העקבים וחוזרים לעמידה."}
        </Example>
        <Example label="כך כותבים (דגשים)">{"הגב נשאר ישר\nהברכיים בכיוון הבהונות"}</Example>
        <InfoBox title="קישור YouTube" tone="info">
          מקבלים קישור של YouTube בלבד, בכל אחת מהצורות: <span dir="ltr">https://youtu.be/…</span>,{" "}
          <span dir="ltr">https://www.youtube.com/watch?v=…</span> או <span dir="ltr">https://www.youtube.com/shorts/…</span>.
          הסרטון לא חובה, ואפשר להוסיף אחר כך.
        </InfoBox>
      </Section>

      <Section id="workouts" title="בניית אימון">
        <Sub title="פרטי האימון">
          <p>
            <b>שם</b>: {FIELD_HELP.workoutTitle} <b>ענף</b>: {FIELD_HELP.workoutSport} <b>משך</b>: {FIELD_HELP.workoutMinutes}
          </p>
        </Sub>

        <Sub title="מקטעים, בלוקים ותרגילים">
          <p>
            <b>מקטע</b> הוא חלק באימון (חימום, עיקרי, קירור). בתוך מקטע יש <b>בלוקים</b>, וכל בלוק קובע איך עובדים:
            בסטים, במעגל, לפי זמן. בתוך בלוק יש <b>תרגילים</b> (שורות). את הסגנון בוחרים בבלוק, ומתחת לבחירה מופיע הסבר
            מלא.
          </p>
        </Sub>

        <div className="grid gap-4 md:grid-cols-2">
          {BLOCK_STYLES.map((style) => (
            <div key={style} className="flex flex-col gap-2 rounded-xl border border-border bg-well p-4">
              <h3 className="text-body-lg font-bold">{STYLE_LABELS[style]}</h3>
              <p className="text-body-md leading-6">{STYLE_HELP[style].what}</p>
              <p className="text-body-md leading-6 text-text-secondary">
                <b>מה ממלאים: </b>
                {STYLE_HELP[style].fields}
              </p>
              <p className="text-body-md leading-6 text-text-secondary">
                <b>דוגמה: </b>
                {STYLE_HELP[style].example}
              </p>
            </div>
          ))}
        </div>

        <Sub title="המספרים בשורת תרגיל">
          <ul className="list-disc space-y-1 ps-6">
            <li><b>סטים:</b> {FIELD_HELP.sets}</li>
            <li><b>חזרות:</b> {FIELD_HELP.reps} <b>טווח:</b> {FIELD_HELP.repsMax}</li>
            <li><b>עומס:</b> {FIELD_HELP.load}</li>
            <li><b>מנוחה:</b> {FIELD_HELP.rest}</li>
            <li><b>אזור (1 עד 5):</b> {FIELD_HELP.zone}</li>
            <li><b>RPE (1 עד 10):</b> {FIELD_HELP.rpe}</li>
          </ul>
        </Sub>
        <InfoBox title="שניות או דקות?" tone="info">
          הממשק מראה כל שדה ביחידה הטבעית שלו, ומסמן אותה בשם השדה. מנוחה והחזקות הן בשניות. משך של ריצה, שחייה ובלוק
          AMRAP / EMOM הוא בדקות (אפשר גם 2.5). מרחק הוא במטרים. שדה עם כוכבית * הוא חובה.
        </InfoBox>
        <InfoBox title="ריצה ושחייה" tone="info">
          לריצה או שחייה פשוטה בחרו בלוק <b>סיבולת</b> (כפתור ״בלוק ריצה / שחייה״). אין בו תרגילים מהבנק: כל שורה היא
          מקטע שמגדירים לפי זמן או מרחק, עם אזור ו-RPE. אפשר להזין אזור, RPE, או את שניהם. שניהם לא חובה, ובלי שניהם
          הלקוח לא רואה עוצמה.
        </InfoBox>

        <Sub title="אתגר מעבר רמה">
          <p>
            אימון מסוג אתגר נבנה כמו כל אימון, ובנוסף יש לו <b>מטרה</b> בעברית: {FIELD_HELP.challengeGoal} הלקוח לא
            מקליד תוצאות. הוא קורא את המטרה, מבצע, ולוחץ ״עברתי״ או ״עוד לא״. אפשר לנסות שוב ללא הגבלה.
          </p>
        </Sub>
      </Section>

      <Section id="publishing" title="סדר, פרסום וסטטוסים">
        <Sub title="סטטוסים">
          <ul className="list-disc space-y-1 ps-6">
            <li><b>טיוטה:</b> רק אתם רואים. אפשר לערוך חופשי, ואפשר למחוק לצמיתות.</li>
            <li><b>מפורסם:</b> הלקוחות רואים אותו במקום שלו ברשימה. שינויים נראים מיד.</li>
            <li><b>בארכיון:</b> הוסר מהלקוחות אבל נשמר. אפשר לשחזר לטיוטה.</li>
          </ul>
        </Sub>
        <Sub title="סדר האימונים">
          <p>
            הלקוחות עוברים את האימונים <b>לפי הסדר בלבד</b>. הסדר נקבע ברשימת הרמה: גוררים, או משתמשים בחצים, או כותבים
            מספר מיקום. האתגר נשאר אחרון. אפשר לשנות סדר גם כשיש כבר לקוחות באמצע.
          </p>
        </Sub>
        <Sub title="כפתורים ברשימת הרמה">
          <ul className="list-disc space-y-1 ps-6">
            <li><b>עריכה:</b> פותחת את האימון.</li>
            <li><b>פרסום / הסרה מפרסום:</b> מחליפים בין טיוטה למפורסם. פרסום נכשל אם חסר שם, מטרה באתגר או שדה חובה.</li>
            <li><b>שכפול:</b> עותק כטיוטה בסוף הרשימה, כדי להתחיל מאימון דומה.</li>
            <li><b>מחיקה:</b> לטיוטות בלבד, לצמיתות.</li>
            <li><b>ארכיון / שחזור לטיוטה:</b> לאימונים שפורסמו.</li>
          </ul>
        </Sub>
        <InfoBox title="לפני שמסירים אימון שלקוחות כבר עשו" tone="warn">
          העברה לארכיון מעלימה את האימון מהלקוחות, ושינוי הסדר או הוספת אימון באמצע משפיעים על מי שעומד באמצע הרמה. אם
          אפשר, הוסיפו אימונים חדשים בסוף הרשימה (לפני האתגר).
        </InfoBox>
      </Section>

      <Section id="customer" title="מה הלקוח רואה">
        <ul className="list-disc space-y-1.5 ps-6 text-body-md leading-7 text-text-secondary">
          <li><b>מפה:</b> לכל תוכנית יש מפת דרכים. כל אימון הוא תחנה, ובין הרמות מופיע האתגר. האימון הבא פתוח, והאחרים נעולים עד שמגיעים אליהם.</li>
          <li><b>רקע לפי ענף:</b> רקע המפה והאימון נקבע לפי הענף שרוב האימונים ברמה מסומנים בו, ולכן סימון נכון של ענף באימון חשוב.</li>
          <li><b>אימון:</b> הלקוח קורא את המקטעים והתרגילים, ויכול ללחוץ על כל תרגיל כדי לראות את עמוד ההסבר שלו (תיאור, דגשים, סרטון).</li>
          <li><b>ליווי:</b> אופציונלי. מנחה צעד אחר צעד עם טיימר מנוחה, או שהלקוח פשוט קורא וסוגר את האימון.</li>
          <li><b>אתגר ודילוג:</b> לקוח שסיים את אימוני הרמה עושה את האתגר כדי לעבור. אפשר לנסות לדלג קדימה על ידי מעבר האתגר של רמה שמתחת לרמה שרוצים להתחיל בה.</li>
          <li><b>נקודות ורצף:</b> אימון שהושלם ואתגר שעברו מזכים בנקודות, ורמות שדילגו עליהן לא מזכות. הרצף שבועי. כל זה מחושב אוטומטית מהאימונים שהושלמו.</li>
          <li><b>חזרה על אימון:</b> אימון שהושלם אפשר לעשות שוב, בלי נקודות נוספות.</li>
        </ul>
      </Section>

      <Section id="customers" title="לקוחות ורשימת המתנה">
        <Sub title="הוספת לקוח">
          <Steps>
            <li>במסך ״הוספת לקוח״ כותבים את המייל של חשבון ה-Google של הלקוח.</li>
            <li>מסמנים את התוכניות שרכש (אפשר כמה).</li>
            <li>שומרים. מרגע זה הלקוח יכול להיכנס, בלי סיסמה, רק עם Google.</li>
          </Steps>
          <p>כל תוכנית מתחילה ברמה הראשונה. מייל שלא נוסף לא יכול להיכנס, והוא יקבל הודעה שאינו מוזמן.</p>
        </Sub>
        <Sub title="רשימת המתנה">
          <p>
            הנרשמים מהאתר הציבורי. הרשימה לקריאה בלבד. כדי לתת למישהו גישה לוחצים ״הוספה כלקוח״ בשורה שלו.
          </p>
        </Sub>
        <Sub title="רשימת לקוחות">
          <p>
            ״הוזמן״ אומר שהלקוח נוסף אבל עוד לא התחבר. ״פעיל״ אומר שהתחבר. אם לקוח לא מצליח להיכנס, בדקו שהמייל כתוב
            בדיוק כמו חשבון ה-Google שלו.
          </p>
        </Sub>
        <InfoBox title="מה עוד לא אפשר מהמערכת" tone="info">
          שינוי תוכנית או רמה ללקוח קיים, והסרת לקוח, עדיין לא נבנו כאן.
        </InfoBox>
      </Section>

      <Section id="troubleshooting" title="הודעות שגיאה ומה לעשות">
        <div className="flex flex-col gap-3">
          {TROUBLESHOOTING.map((item) => (
            <div key={item.problem} className="flex flex-col gap-1 rounded-xl border border-border bg-well p-4">
              <p className="text-body-md font-bold text-ember">״{item.problem}״</p>
              <p className="text-body-md leading-6 text-text-secondary">
                <b>מה זה אומר: </b>
                {item.meaning}
              </p>
              <p className="text-body-md leading-6">
                <b>מה עושים: </b>
                {item.fix}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="glossary" title="מילון קצר">
        <dl className="grid gap-x-8 gap-y-3 text-body-md leading-6 md:grid-cols-2">
          {[
            ["סט", "סדרה אחת של חזרות, ואחריה מנוחה."],
            ["חזרה", "ביצוע אחד של התרגיל."],
            ["RPE", "כמה קשה זה מרגיש, 1 עד 10."],
            ["אזור", "עוצמה בריצה, שחייה וסיבולת, 1 (קל מאוד) עד 5 (מקסימלי)."],
            ["סבב", "מעבר אחד על כל התרגילים בבלוק."],
            ["AMRAP", "כמה שיותר סבבים בזמן קבוע."],
            ["EMOM", "סיבוב חדש בתחילת כל דקה."],
            ["טיוטה", "אימון שעוד לא מפורסם ורק אתם רואים."],
            ["אתגר מעבר רמה", "האימון האחרון ברמה. עוברים אותו כדי להתקדם."],
            ["ליווי", "מצב שמנחה את הלקוח צעד אחר צעד בזמן האימון."],
          ].map(([term, meaning]) => (
            <div key={term} className="flex gap-3 border-b border-border/60 pb-2">
              <dt className="w-28 shrink-0 font-bold">{term}</dt>
              <dd className="text-text-secondary">{meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
