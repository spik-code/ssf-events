import { LoginForm } from "@/components/admin/LoginForm";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  const message =
    error === "link_expired"
      ? "That link has expired or was already used. Send a fresh one."
      : error === "missing_code"
        ? "That link was incomplete. Send a fresh one."
        : null;

  return (
    <main className="auth">
      <div className="auth-card">
        <svg className="ring" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="18" stroke="var(--gold)" strokeWidth="1.4" />
          <circle
            cx="20"
            cy="20"
            r="14.5"
            stroke="var(--gold)"
            strokeWidth="1"
            strokeDasharray="1.6 2.4"
          />
          <text
            x="20"
            y="24.5"
            textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="12"
            fontWeight="600"
            fill="var(--gold)"
          >
            SSF
          </text>
        </svg>

        <h1 className="h2">Sign in</h1>
        <p className="note">
          {SITE.name} admin. Enter your email and we&rsquo;ll send a one-tap link &mdash; no
          password to remember.
        </p>

        {message && (
          <p className="auth-error" role="alert">
            {message}
          </p>
        )}

        <LoginForm next={next} />

        <p className="auth-foot">
          Only the owner&rsquo;s email can sign in here. Anyone else gets a link that
          won&rsquo;t grant access.
        </p>
      </div>
    </main>
  );
}
