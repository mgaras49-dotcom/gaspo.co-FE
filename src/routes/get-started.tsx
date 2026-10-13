import { useEffect, useState } from "react";
import { PageMeta } from "@/components/PageMeta";
import { SLACK_CREATE_ACCOUNT_URL, startSlackLogin } from "@/lib/auth";
import microsoftTeamsIcon from "@/assets/images/microsoft-teams.svg";
import { CasaTier3Badge, CcpaBadge, GdprBadge } from "@/components/icons/compliance-badges";

const testimonials = [
  {
    quote:
      "Gaspo is like Claude, but you can interact with him like with a colleague, not an LLM. He can run projects and scheduled tasks in the cloud, and everybody on the team can interact with it.",
    name: "Tobias Giesen",
    role: "CEO, Growably",
    image: "/images/testimonials/tobias-giesen.webp",
  },
  {
    quote:
      "Nothing short of revolutionary. The best attempt I've ever had as a CEO to turn every employee into an AI-first operator.",
    name: "Ben Diamond",
    role: "CEO, True Classic",
    image: "/images/testimonials/ben-diamond.webp",
  },
  {
    quote:
      "Gaspo is like the most capable all-round colleague you can imagine. He just does the work.",
    name: "Sam Kopelman",
    role: "CEO, Givr",
    image: "/images/testimonials/sam-kopelman.webp",
  },
  {
    quote: "Mindblowing all-in-one AI which does everything in a single solution.",
    name: "Antonín Štětina",
    role: "CEO, KULINA Group",
    image: "/images/testimonials/antonin-stetina.webp",
  },
  {
    quote:
      "Gaspo is our eyes, ears, and hands. It's made us realize that we might really never have to hire someone.",
    name: "Jordan Dikoum",
    role: "Co-Founder, UniTru Inc.",
    image: "/images/testimonials/jordan-dikoum.webp",
  },
  {
    quote: "An incredible tool — it was almost instantly adopted by the bulk of my team.",
    name: "Boris Wexler",
    role: "CEO, Space Dinosaurs",
    image: "/images/testimonials/boris-wexler.webp",
  },
  {
    quote: "Like a virtual personal assistant who you don't have to manage as their therapist.",
    name: "Richard Comer",
    role: "Owner, Flagship Financial",
    image: "/images/testimonials/richard-comer.webp",
  },
];

const engineerLogos = [
  { alt: "Meta AI", src: "/images/engineer-logos/meta-ai.svg" },
  { alt: "University of Oxford", src: "/images/engineer-logos/oxford.svg" },
  { alt: "Google", src: "/images/engineer-logos/google.svg" },
  { alt: "Tesla", src: "/images/engineer-logos/tesla.svg" },
  { alt: "Amazon", src: "/images/engineer-logos/amazon.svg" },
];

const complianceBadges = [
  { Icon: CasaTier3Badge, alt: "CASA Tier 3 Certified" },
  { Icon: GdprBadge, alt: "GDPR Aligned" },
  { Icon: CcpaBadge, alt: "CCPA Compliant" },
];

const authButtonClass =
  "inline-flex w-full min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-[#d9d9d9] bg-transparent px-4 py-2 text-sm font-medium text-foreground outline-0 transition-[background-color,border-color,transform] hover:bg-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export default function GetStarted() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActiveIndex((current) => (current + 1) % testimonials.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  const testimonial = testimonials[activeIndex];

  return (
    <div className="flex max-md:min-h-screen flex-col bg-white md:h-screen md:flex-row-reverse">
      <PageMeta
        title="Try Gaspo for free — $100 credits included"
        description="Sign up for Gaspo with Slack. No credit card required."
      />

      {/* Sign-up panel */}
      <div className="relative flex w-full flex-1 flex-col overflow-hidden lg:shrink-0">
        <div className="absolute left-5 top-5 z-10 text-[#000] md:hidden">
          <GaspoLogo />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-[440px] px-4">
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                <h1 className="text-center font-display text-[32px] font-bold leading-[1.25] tracking-[-0.64px] text-foreground">
                  Try Gaspo for free.
                  <br />
                  <span>$100 credits included.</span>
                </h1>

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
                    Signing up needs a Slack account. New to Slack?{" "}
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
              </div>
              <div className=" flex items-center justify-center gap-1 text-sm font-medium text-foreground sm:gap-2">
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[440px] self-center p-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-row items-center justify-center text-foreground/80 opacity-50">
              {complianceBadges.map(({ Icon, alt }) => (
                <Icon key={alt} className="h-14 w-14 shrink-0" aria-label={alt} />
              ))}
            </div>
            <p className="text-center text-xs text-foreground/80">
              By signing up, you agree to the Gaspo{" "}
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
      </div>

      {/* Testimonial panel */}
      <div className="gaspo-auth-gradient relative hidden flex-1 flex-col overflow-hidden md:flex md:h-auto">
        <div className="mono-invert absolute left-5 top-5 z-10 text-[#000]">
          <GaspoLogo />
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-5 px-4 py-6 md:gap-6 md:px-10 md:py-0">
          <div className="relative h-[280px] w-full max-w-[448px]">
            <div className="gaspo-glass-card flex h-[280px] flex-col gap-6 rounded-[32px] p-8 text-[#000]">
              <p className="flex-1 text-[16px] leading-6">{testimonial.quote}</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="size-11 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <p className="text-sm font-bold leading-5">{testimonial.name}</p>
                    <p className="text-sm leading-5 text-[#000]/80">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/10"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 flex-col items-center gap-[23px] p-6 text-white">
          <p
            className="text-xs uppercase tracking-[0.24px] text-[#f5f3f0]"
            style={{ fontFamily: '"Roboto Mono", monospace' }}
          >
            Built by engineers from:
          </p>
          <div className="grid w-full grid-cols-5 gap-2">
            {engineerLogos.map((logo) => (
              <div key={logo.alt} className="flex h-14 items-center justify-center overflow-hidden">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-[24px] max-w-[85%] object-contain"
                />
              </div>
            ))}
          </div>
        </div>
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
