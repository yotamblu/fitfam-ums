"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/lib/types";

export type AdminSession = {
  user: CurrentUser;
  /** Call when the API says the session is gone or not allowed (401/403): returns to the login screen. */
  onSessionLost: () => void;
};

export const AdminSessionContext = createContext<AdminSession | null>(null);

/** The logged-in admin, available to every page inside the shell. */
export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error("useAdminSession must be used inside AdminShell");
  return session;
}
