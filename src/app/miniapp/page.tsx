import { MiniAppClient } from "./client";

export const metadata = {
  title: "Quick Add — EthioBudget",
};

// Telegram Mini App entry point. Must be served over HTTPS.
// The client component injects telegram-web-app.js dynamically and polls
// for window.Telegram.WebApp to handle async script loading reliably.

export default function MiniAppPage() {
  return <MiniAppClient />;
}
