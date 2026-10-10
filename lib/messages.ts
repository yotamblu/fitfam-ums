import { ApiError } from "./api";

const MESSAGES: Record<string, string> = {
  invalid_token: "ההתחברות עם Google נכשלה. נסו שוב.",
  email_not_verified: "כתובת המייל בחשבון ה-Google לא מאומתת.",
  not_invited: "המייל הזה לא רשום במערכת. פנו לאחד המנהלים.",
  email_exists: "הכתובת הזו כבר קיימת במערכת.",
  unknown_plan: "נבחרה תוכנית שלא קיימת.",
  no_plans: "יש לבחור לפחות תוכנית אחת.",
  invalid_request: "הנתונים שהוזנו אינם תקינים. בדקו את המייל ואת התוכניות.",
  conflict: "הכתובת הזו כבר קיימת במערכת.",
  api_unreachable: "השרת לא זמין כרגע. נסו שוב עוד רגע.",
  api_not_configured: "כתובת ה-API לא מוגדרת בשרת (API_ORIGIN).",
  forbidden_origin: "הבקשה נחסמה. רעננו את הדף ונסו שוב.",
  waitlist_unavailable: "רשימת ההמתנה לא זמינה כרגע.",
  exercise_exists: "כבר יש תרגיל בשם הזה בענף הזה.",
  exercise_not_found: "התרגיל לא נמצא.",
  exercise_in_use: "אי אפשר לשנות את סוג המדידה של תרגיל שכבר בשימוש באימונים.",
  invalid_video_url: "הקישור לסרטון חייב להיות קישור YouTube (https).",
  invalid_sport: "הענף שנבחר אינו תקין.",
  invalid_measure: "סוג המדידה שנבחר אינו תקין.",
  invalid_minutes: "משך האימון חייב להיות בין 1 ל-600 דקות.",
  invalid_type: "סוג האימון אינו תקין.",
  type_immutable: "אי אפשר לשנות אימון רגיל לאתגר או להפך.",
  level_not_found: "הרמה לא נמצאה.",
  workout_not_found: "האימון לא נמצא.",
  workout_archived: "האימון בארכיון. שחזרו אותו קודם.",
  challenge_exists: "כבר יש אתגר פעיל ברמה הזו.",
  order_mismatch: "הרשימה השתנתה בינתיים (אולי על ידי שותף). הרשימה נטענה מחדש.",
  not_a_draft: "אפשר למחוק רק טיוטה. אימון שפורסם אפשר להעביר לארכיון.",
  title_required: "כדי לפרסם צריך שם לאימון.",
  goal_required: "כדי לפרסם אתגר צריך לכתוב את המטרה שלו.",
  invalid_content: "תוכן האימון אינו תקין.",
  google_unavailable: "אי אפשר להגיע ל-Google כרגע. נסו שוב עוד רגע.",
};

/** A Hebrew, user-facing message for any error thrown while talking to the API. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? "משהו השתבש. נסו שוב.";
  }
  return "אי אפשר להגיע לשרת. בדקו שהוא פועל ונסו שוב.";
}
