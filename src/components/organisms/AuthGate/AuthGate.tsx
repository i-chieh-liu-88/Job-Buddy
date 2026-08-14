import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import type { PropsWithChildren } from "react";
import { NewtonLoader } from "../../atoms/NewtonLoader/NewtonLoader";
import { ArchitectureWaveBackground } from "../../backgrounds/ArchitectureWaveBackground/ArchitectureWaveBackground";

export function AuthGate({ children }: PropsWithChildren) {
  return (
    <>
      <ClerkLoading>
        <main className="grid min-h-screen place-items-center bg-canvas px-6">
          <NewtonLoader label="Entering Job Buddy workspace" size={64} />
        </main>
      </ClerkLoading>

      <ClerkLoaded>
        <SignedIn>{children}</SignedIn>
        <SignedOut>
          <main className="grid min-h-screen place-items-center bg-canvas p-4 text-ink sm:p-8 lg:p-12">
            <section className="grid min-h-[min(44rem,calc(100vh-4rem))] w-full max-w-[88rem] overflow-hidden rounded-lg border border-line bg-[#090a0f] shadow-[0_28px_80px_rgba(0,0,0,0.48)] lg:grid-cols-[1.08fr_0.92fr]">
              <div className="flex min-h-[38rem] flex-col border-b border-line lg:min-h-0 lg:border-b-0 lg:border-r">
                <header className="flex items-center justify-between border-b border-line px-6 py-5 sm:px-8">
                  <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">01 — Job Buddy</span>
                  <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-primary">Application system</span>
                </header>
                <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-8 lg:px-12">
                  <p className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">Job search, organized</p>
                  <h1 className="mt-8 max-w-xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                    <span className="block">Organize</span>
                    <span data-testid="landing-headline-primary" className="block bg-gradient-to-r from-primary via-[#a5b4fc] to-[#c7d2fe] bg-clip-text text-transparent">every move</span>
                    <span className="block">with clarity.</span>
                  </h1>
                  <p className="mt-7 max-w-md text-sm leading-6 text-muted sm:text-base sm:leading-7">
                    Track every job opportunity from saved to final decision in one calm, focused workspace.
                  </p>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <SignInButton mode="modal">
                      <button type="button" className="rounded-lg bg-primary px-5 py-3 font-semibold text-[#0A0A0A] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Sign in</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button type="button" className="rounded-lg border border-line bg-surface/80 px-5 py-3 font-semibold text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Create account</button>
                    </SignUpButton>
                  </div>
                </div>
                <ul className="grid grid-cols-1 border-t border-line sm:grid-cols-3">
                  {[
                    ["Track every application", "One clear view of every role and its next step."],
                    ["Move forward visually", "Drag opportunities through your search pipeline."],
                    ["Keep details close", "Notes, links, and resume versions stay together."],
                  ].map(([title, description]) => (
                    <li key={title} className="border-b border-line p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                      <span className="mb-4 block size-2 rounded-full bg-primary shadow-[0_0_14px_#818cf8]" />
                      <h2 className="text-sm font-medium text-ink">{title}</h2>
                      <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <ArchitectureWaveBackground className="min-h-[31rem] lg:min-h-0" />
            </section>
          </main>
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
