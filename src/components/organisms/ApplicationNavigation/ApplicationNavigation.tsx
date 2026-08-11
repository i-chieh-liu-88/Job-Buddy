import type { ReactNode } from "react";
import {
  JOB_APPLICATION_STATUS_ORDER,
  JOB_APPLICATION_STATUS_PRESENTATION,
} from "../../../lib/jobApplicationStatusPresentation";
import type { JobApplicationStatus } from "../../../types/database";

export type ApplicationStageCounts = Record<JobApplicationStatus, number>;

type ApplicationNavigationProps = {
  accountMenu: ReactNode;
  isAddDisabled: boolean;
  onAddApplication: (opener: HTMLButtonElement) => void;
  stageCounts: ApplicationStageCounts;
};

const futureNavigationItems = ["Stats", "Reminders", "Export"] as const;

function StageSummary({ stageCounts }: { stageCounts: ApplicationStageCounts }) {
  return (
    <section className="mt-8" aria-labelledby="stage-summary-title">
      <h2
        id="stage-summary-title"
        className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
      >
        Pipeline
      </h2>
      <ul className="mt-3 space-y-1">
        {JOB_APPLICATION_STATUS_ORDER.map((status) => {
          const presentation = JOB_APPLICATION_STATUS_PRESENTATION[status];

          return (
            <li
              key={status}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${presentation.indicatorClassName}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">{presentation.label}</span>
              <span className="tabular-nums" aria-label={`${stageCounts[status]} applications`}>
                {stageCounts[status]}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ApplicationNavigation({
  accountMenu,
  isAddDisabled,
  onAddApplication,
  stageCounts,
}: ApplicationNavigationProps) {
  return (
    <div className="hidden min-h-screen shrink-0 md:flex">
      <aside
        className="flex w-16 flex-col items-center border-r border-line bg-ink py-4 text-white"
        aria-label="Job Buddy workspace"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-xs font-bold text-ink">
          JB
        </span>
        <span
          className="mt-6 grid size-9 place-items-center rounded-lg bg-white/12 text-sm font-semibold"
          aria-current="page"
          aria-label="Applications workspace"
        >
          A
        </span>
      </aside>

      <aside className="flex w-56 flex-col border-r border-line bg-surface px-3 py-5">
        <div className="px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Job Buddy
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">Workspace</p>
        </div>

        <button
          type="button"
          className="mt-5 min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
          disabled={isAddDisabled}
          onClick={(event) => onAddApplication(event.currentTarget)}
        >
          <span aria-hidden="true">＋</span> Add application
        </button>

        <nav className="mt-6" aria-label="Applications">
          <ul className="space-y-1">
            <li>
              <a
                href="/"
                aria-current="page"
                className="flex min-h-10 items-center rounded-lg bg-hover px-3 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Applications
              </a>
            </li>
            {futureNavigationItems.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="flex min-h-10 w-full cursor-not-allowed items-center justify-between rounded-lg px-3 text-left text-sm text-muted opacity-70"
                  aria-label={`${item} — Soon`}
                  disabled
                >
                  <span>{item}</span>
                  <span className="text-[0.625rem] font-semibold uppercase tracking-wider">
                    Soon
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <StageSummary stageCounts={stageCounts} />
        </nav>

        <div className="mt-auto border-t border-line px-3 pt-4">
          <p className="mb-2 text-xs text-muted">Signed in</p>
          {accountMenu}
        </div>
      </aside>
    </div>
  );
}
