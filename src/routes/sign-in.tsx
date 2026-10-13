import { Link } from "react-router-dom";
import { PageMeta } from "@/components/PageMeta";
import { SLACK_CREATE_ACCOUNT_URL, startSlackLogin } from "@/lib/auth";
import gaspoAvatar from "@/assets/images/gaspo-marketplace-avatar.svg";
import microsoftTeamsIcon from "@/assets/images/microsoft-teams.svg";

const authButtonClass =
  "inline-flex w-full min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground outline-0 transition-[background-color,border-color,transform] hover:bg-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export default function SignIn() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <PageMeta title="Sign in to Gaspo" description="Sign in to Gaspo with Slack." />

      <div className="absolute left-5 top-5 z-10">
        <GaspoLogo />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-[360px] flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <img
              src={gaspoAvatar}
              alt=""
              className="size-14 rounded-lg"
              width={56}
              height={56}
              aria-hidden
            />
            <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button type="button" className={authButtonClass} onClick={startSlackLogin}>
              <SlackIcon />
              Continue with Slack
            </button>
            {/* Gaspo runs on Slack only; Teams is not built yet, so this button only says so. */}
            <button type="button" className={authButtonClass} disabled>
              <img src={microsoftTeamsIcon} alt="" className="size-5 shrink-0" aria-hidden />
              Microsoft Teams: coming soon
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Signing in needs a Slack account. New to Slack?{" "}
              <a
                href={SLACK_CREATE_ACCOUNT_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline"
              >
                Create one
              </a>
              , then come back to this tab and continue with Slack.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/get-started" className="font-medium text-foreground underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="p-6">
        <p className="text-center text-xs text-muted-foreground">
          By logging in, you agree to the Gaspo{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}

function GaspoLogo() {
  return (
    <img
      src="/assets/brand/logos/gaspo-logo-soft-black.svg"
      alt="Gaspo"
      className="block h-7 w-auto"
      width={112}
      height={28}
    />
  );
}

function SlackIcon() {
  return (
    <svg
      viewBox="0 0 127 127"
      xmlns="http://www.w3.org/2000/svg"
      className="size-5 shrink-0"
      aria-hidden
    >
      <path
        d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"
        fill="#E01E5A"
      />
      <path
        d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"
        fill="#36C5F0"
      />
      <path
        d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"
        fill="#2EB67D"
      />
      <path
        d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"
        fill="#ECB22E"
      />
    </svg>
  );
}
