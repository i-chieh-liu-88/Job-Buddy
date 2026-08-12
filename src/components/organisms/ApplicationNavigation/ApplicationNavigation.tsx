import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarHeader,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarRail,
  useAnimatedSidebar,
} from "../../atoms/AnimatedSidebar/AnimatedSidebar";
import { cn } from "../../../lib/cn";
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

type DesktopDestination = {
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  isActive?: boolean;
  label: string;
};

function StageSummary({
  stageCounts,
  titleId,
}: {
  stageCounts: ApplicationStageCounts;
  titleId: string;
}) {
  return (
    <section className="mt-8" aria-labelledby={titleId}>
      <h2
        id={titleId}
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
              <span
                className="tabular-nums"
                aria-label={`${stageCounts[status]} applications`}
              >
                {stageCounts[status]}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ApplicationDestinations({
  stageCounts,
  summaryTitleId,
}: {
  stageCounts: ApplicationStageCounts;
  summaryTitleId: string;
}) {
  return (
    <>
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

      <StageSummary stageCounts={stageCounts} titleId={summaryTitleId} />
    </>
  );
}

function DesktopIdentity({ isCollapsed }: { isCollapsed: boolean }): ReactNode {
  if (isCollapsed) {
    return (
      <div
        className="grid size-10 place-items-center self-center rounded-xl bg-hover text-ink"
        title="Workspace"
      >
        <BriefcaseBusiness aria-hidden="true" className="size-5" />
      </div>
    );
  }

  return (
    <div className="px-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Job Buddy
      </p>
      <p className="mt-1 text-lg font-semibold text-ink">Workspace</p>
    </div>
  );
}

function DesktopAddApplicationButton(props: {
  disabled: boolean;
  isCollapsed: boolean;
  onAddApplication: (opener: HTMLButtonElement) => void;
}): ReactNode {
  const { disabled, isCollapsed, onAddApplication } = props;

  return (
    <button
      type="button"
      className={cn(
        "mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-ink transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none",
        isCollapsed ? "size-10 self-center p-0" : "px-4 py-2",
      )}
      aria-label={isCollapsed ? "Add application" : undefined}
      title={isCollapsed ? "Add application" : undefined}
      disabled={disabled}
      onClick={(event) => onAddApplication(event.currentTarget)}
    >
      <Plus aria-hidden="true" className="size-4" />
      {!isCollapsed ? <span className="ml-2">Add application</span> : null}
    </button>
  );
}

function DesktopApplicationDestinations(props: {
  isCollapsed: boolean;
  stageCounts: ApplicationStageCounts;
}): ReactNode {
  const { isCollapsed, stageCounts } = props;

  const destinations: readonly DesktopDestination[] = [
    {
      label: "Applications",
      icon: <LayoutDashboard className="size-4" />,
      href: "/",
      isActive: true,
    },
    {
      label: "Stats",
      icon: <BarChart3 className="size-4" />,
      disabled: true,
    },
    {
      label: "Reminders",
      icon: <Bell className="size-4" />,
      disabled: true,
    },
    {
      label: "Export",
      icon: <Download className="size-4" />,
      disabled: true,
    },
  ];

  return (
    <nav aria-label="Applications">
      <AnimatedSidebarMenu>
        {destinations.map((destination) => (
          <AnimatedSidebarMenuItem key={destination.label}>
            <AnimatedSidebarMenuButton
              href={destination.href}
              icon={destination.icon}
              isActive={destination.isActive}
              disabled={destination.disabled}
              aria-label={
                isCollapsed
                  ? destination.label
                  : destination.disabled
                    ? `${destination.label} — Soon`
                    : undefined
              }
              title={isCollapsed ? destination.label : undefined}
              className={cn(
                isCollapsed &&
                  "justify-center gap-0 px-0 [&>span.flex-1]:hidden",
              )}
              badge={
                destination.disabled && !isCollapsed ? (
                  <span className="text-[0.625rem] font-semibold uppercase tracking-wider">
                    Soon
                  </span>
                ) : undefined
              }
            >
              {isCollapsed ? null : destination.label}
            </AnimatedSidebarMenuButton>
          </AnimatedSidebarMenuItem>
        ))}
      </AnimatedSidebarMenu>

      <section
        className="mt-6"
        aria-labelledby={isCollapsed ? undefined : "desktop-stage-summary-title"}
      >
        {!isCollapsed ? (
          <h2
            id="desktop-stage-summary-title"
            className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
          >
            Pipeline
          </h2>
        ) : null}
        <ul className={cn(!isCollapsed && "mt-3", "space-y-1")}>
          {JOB_APPLICATION_STATUS_ORDER.map((status) => {
            const presentation = JOB_APPLICATION_STATUS_PRESENTATION[status];
            const description = `${presentation.label} · ${stageCounts[status]} applications`;

            return (
              <li
                key={status}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${presentation.indicatorClassName}`}
                  aria-hidden={isCollapsed ? undefined : true}
                  aria-label={isCollapsed ? description : undefined}
                  title={isCollapsed ? description : undefined}
                />
                {!isCollapsed ? (
                  <>
                    <span className="min-w-0 flex-1">{presentation.label}</span>
                    <span className="tabular-nums" aria-label={`${stageCounts[status]} applications`}>
                      {stageCounts[status]}
                    </span>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </nav>
  );
}

function DesktopApplicationNavigation({
  accountMenu,
  isAddDisabled,
  onAddApplication,
  stageCounts,
}: ApplicationNavigationProps): ReactNode {
  const { open, state } = useAnimatedSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="hidden min-h-screen shrink-0 md:flex">
      <aside
        data-testid="workspace-rail"
        className="flex w-16 shrink-0 flex-col items-center border-r border-line bg-ink py-4 text-white"
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
      <AnimatedSidebar
        ariaLabel="Application navigation"
        collapsible="icon"
        desktopOnly
        side="left"
        className="border-r border-line bg-surface text-ink"
      >
        <AnimatedSidebarHeader>
          <DesktopIdentity isCollapsed={isCollapsed} />
          <DesktopAddApplicationButton
            isCollapsed={isCollapsed}
            disabled={isAddDisabled}
            onAddApplication={onAddApplication}
          />
        </AnimatedSidebarHeader>
        <AnimatedSidebarContent>
          <DesktopApplicationDestinations
            isCollapsed={isCollapsed}
            stageCounts={stageCounts}
          />
        </AnimatedSidebarContent>
        <AnimatedSidebarFooter>
          {!isCollapsed ? <p className="mb-2 text-xs text-muted">Signed in</p> : null}
          <div className={cn(isCollapsed && "flex justify-center")}>{accountMenu}</div>
        </AnimatedSidebarFooter>
        <AnimatedSidebarRail
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? (
            <ChevronLeft aria-hidden="true" className="size-4" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-4" />
          )}
        </AnimatedSidebarRail>
      </AnimatedSidebar>
    </div>
  );
}

export function ApplicationNavigation({
  accountMenu,
  isAddDisabled,
  onAddApplication,
  stageCounts,
}: ApplicationNavigationProps) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const closeDrawerButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const focusRestorationFrameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (focusRestorationFrameRef.current !== null) {
        window.cancelAnimationFrame(focusRestorationFrameRef.current);
      }
    },
  );

  function openDrawer() {
    drawerRef.current?.showModal();
    closeDrawerButtonRef.current?.focus();
  }

  function closeDrawer() {
    drawerRef.current?.close();
  }

  function restoreMenuFocus() {
    if (focusRestorationFrameRef.current !== null) {
      window.cancelAnimationFrame(focusRestorationFrameRef.current);
    }

    focusRestorationFrameRef.current = window.requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
      focusRestorationFrameRef.current = null;
    });
  }

  return (
    <>
      <DesktopApplicationNavigation
        accountMenu={accountMenu}
        isAddDisabled={isAddDisabled}
        onAddApplication={onAddApplication}
        stageCounts={stageCounts}
      />

      <header className="fixed inset-x-0 top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-canvas px-4 md:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-xl text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
          aria-label="Open navigation"
          onClick={openDrawer}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-[0.08em] text-ink">
          JOB BUDDY
        </span>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-ink transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
          disabled={isAddDisabled}
          onClick={(event) => onAddApplication(event.currentTarget)}
        >
          <span aria-hidden="true">＋</span> Add application
        </button>
      </header>

      <dialog
        ref={drawerRef}
        aria-label="Job Buddy navigation"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none overflow-hidden border-0 border-r border-line bg-surface p-0 text-ink shadow-[0_16px_48px_rgba(30,31,33,0.2)] backdrop:bg-ink/30 open:flex open:flex-col md:hidden"
        onCancel={(event) => {
          event.preventDefault();
          closeDrawer();
        }}
        onClose={restoreMenuFocus}
      >
        <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-sm font-semibold tracking-[0.08em] text-ink">
            JOB BUDDY
          </span>
          <button
            ref={closeDrawerButtonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg text-xl text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
            aria-label="Close navigation"
            onClick={closeDrawer}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Applications">
          <ApplicationDestinations
            stageCounts={stageCounts}
            summaryTitleId="mobile-stage-summary-title"
          />
        </nav>

        <div className="shrink-0 border-t border-line px-4 py-4">
          <p className="mb-2 text-xs text-muted">Signed in</p>
          {accountMenu}
        </div>
      </dialog>
    </>
  );
}
