"use client";

import { useEffect, useRef, useState } from "react";

type GoogleIdentity = {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Renders Google's own "Sign in with Google" button and hands the ID token (credential) to onCredential. */
export default function GoogleSignIn({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return;

    const render = () => {
      const google = window.google;
      if (!google || !buttonRef.current) return;
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => callbackRef.current(response.credential),
      });
      google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "signin_with",
        locale: "he",
        width: 280,
      });
    };

    if (window.google) {
      render();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const onError = () => setFailed(true);
    script.addEventListener("load", render);
    script.addEventListener("error", onError);
    return () => {
      script?.removeEventListener("load", render);
      script?.removeEventListener("error", onError);
    };
  }, []);

  if (!CLIENT_ID) {
    return (
      <p role="alert" className="text-body-md text-danger">
        חסר NEXT_PUBLIC_GOOGLE_CLIENT_ID בקובץ .env.local
      </p>
    );
  }
  if (failed) {
    return (
      <p role="alert" className="text-body-md text-danger">
        לא הצלחנו לטעון את ההתחברות של Google. בדקו את החיבור לאינטרנט ורעננו.
      </p>
    );
  }
  return <div ref={buttonRef} dir="ltr" className="min-h-10" />;
}
