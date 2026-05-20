"use client";

import { useEffect } from "react";

// Restores the session cookie from localStorage if it's missing.
// Telegram WebViews don't reliably persist cookies, so we keep a
// backup token in localStorage and sync it on every page load.
export function AuthSync() {
  useEffect(() => {
    const token = localStorage.getItem("ethiobudget_token");
    if (!token) return;

    // Check if we already have a valid cookie by calling a lightweight endpoint
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (r.ok) return; // cookie is fine
        // Cookie missing — restore it from localStorage
        return fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });
      })
      .catch(() => {
        /* ignore network errors */
      });
  }, []);

  return null;
}
