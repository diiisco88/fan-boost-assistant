import Link from "next/link";
import { MessageCircleHeart, TrendingUp, BellRing, Clock, ArrowRight, Shield } from "lucide-react";

const features = [
  {
    icon: MessageCircleHeart,
    title: "Auto-drafted welcome DMs",
    description:
      "Every new subscriber gets a warm, personal welcome draft ready for your approval the moment they join.",
  },
  {
    icon: TrendingUp,
    title: "Tip thank-you messages",
    description:
      "Never miss thanking a tipper. Fan Boost queues a personalised thank-you for every tip you receive.",
  },
  {
    icon: BellRing,
    title: "Churn risk alerts",
    description:
      "We track engagement signals and flag subscribers who might be drifting — before they cancel.",
  },
  {
    icon: Clock,
    title: "Posting time recommendations",
    description:
      "Your historical performance data surfaces the exact days and times your audience is most engaged.",
  },
];

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary)" }}
          >
            <MessageCircleHeart className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Fan Boost</span>
        </div>
        <Link
          href="/api/auth/fanvue"
          className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto w-full">
        {/* Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }}
        />

        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 border"
          style={{
            background: "rgba(124, 58, 237, 0.1)",
            borderColor: "rgba(124, 58, 237, 0.3)",
            color: "var(--accent)",
          }}
        >
          <Shield className="w-3 h-3" />
          You approve every message. Always.
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          The subs you worked for —
          <br />
          <span style={{ color: "var(--primary)" }}>kept.</span>
        </h1>

        <p className="text-xl max-w-2xl leading-relaxed mb-10" style={{ color: "#94A3B8" }}>
          Fan Boost watches your inbox, tips, and posts so nothing slips through. You approve.
          It just makes sure you actually do.
        </p>

        <Link
          href="/api/auth/fanvue"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "var(--primary)" }}
        >
          Connect Fanvue
          <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="mt-4 text-sm" style={{ color: "#64748B" }}>
          No credit card required · Takes 60 seconds
        </p>
      </section>

      {/* Features */}
      <section
        className="px-6 py-20 border-t"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-4">
            Everything you need to keep fans close
          </h2>
          <p className="text-center mb-14" style={{ color: "#94A3B8" }}>
            Built specifically for Fanvue creators who take their relationship with subscribers seriously.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border"
                  style={{ background: "var(--muted)", borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(124, 58, 237, 0.15)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to stop losing subscribers?</h2>
        <p className="mb-8" style={{ color: "#94A3B8" }}>
          Connect your Fanvue account and Fan Boost starts working immediately.
        </p>
        <Link
          href="/api/auth/fanvue"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Get started free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-sm border-t"
        style={{ borderColor: "var(--border)", color: "#64748B" }}
      >
        Fan Boost Assistant &copy; {new Date().getFullYear()} · Built for Fanvue creators
      </footer>
    </main>
  );
}
