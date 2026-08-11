import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import type { PropsWithChildren } from "react";

export function AuthGate({ children }: PropsWithChildren) {
  return (
    <>
      <ClerkLoading>
        <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
          <p role="status" className="text-slate-600">
            Loading Job Buddy…
          </p>
        </main>
      </ClerkLoading>

      <ClerkLoaded>
        <SignedIn>{children}</SignedIn>
        <SignedOut>
          <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12 text-slate-950">
            <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Job search, organized
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Job Buddy
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                Track every job opportunity from saved to final decision in one
                calm, focused workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Create account
                  </button>
                </SignUpButton>
              </div>
            </section>
          </main>
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
