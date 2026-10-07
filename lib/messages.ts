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
  waitlist_unavailable: "רשימת ההמתנה לא זמינה כרגע.",
  google_unavailable: "אי אפשר להגיע ל-Google כרגע. נסו שוב עוד רגע.",
};

/** A Hebrew, user-facing message for any error thrown while talking to the API. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? "משהו השתבש. נסו שוב.";
  }
  return "אי אפשר להגיע לשרת. בדקו שהוא פועל ונסו שוב.";
}
