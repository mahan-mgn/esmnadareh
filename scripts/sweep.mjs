/**
 * Releases stock held by checkouts that were never paid, by calling the
 * running app's sweep endpoint. The same thing a cron job would do — handy
 * when you want it now.
 *
 *   npm run sweep
 */
const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error(
    "CRON_SECRET is not set, so /api/inventory/sweep is closed. Add it to .env.",
  );
  process.exit(1);
}

const base = (
  process.env.SWEEP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

try {
  const response = await fetch(`${base}/api/inventory/sweep`, {
    headers: { authorization: `Bearer ${secret}` },
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`${response.status} ${body}`);
    process.exit(1);
  }
  console.log(body);
} catch (error) {
  console.error(`Could not reach ${base} — is the app running?`);
  console.error(error.message);
  process.exit(1);
}
