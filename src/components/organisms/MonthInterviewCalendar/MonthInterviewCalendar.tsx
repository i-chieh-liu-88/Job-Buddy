import { ChevronLeft, ChevronRight } from "lucide-react";
import { InterviewEventPopover } from "../../molecules/InterviewEventPopover/InterviewEventPopover";
import type { Interview } from "../../../types/database";

type ApplicationLabel = { company: string; position: string };

type MonthInterviewCalendarProps = {
  applicationLabels: ReadonlyMap<string, ApplicationLabel>;
  interviews: Interview[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onOpenApplication: (applicationId: string) => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_EVENTS = 2;

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(month: Date) {
  return new Date(month.getFullYear(), month.getMonth(), 1);
}

function startOfCalendarGrid(month: Date) {
  const first = startOfMonth(month);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return first;
}

function sameCalendarDate(left: Date, right: Date) {
  return getDateKey(left) === getDateKey(right);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function MonthInterviewCalendar({
  applicationLabels,
  interviews,
  month,
  onMonthChange,
  onOpenApplication,
}: MonthInterviewCalendarProps) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfCalendarGrid(month);
  const today = new Date();
  const interviewsByDate = interviews.reduce<Map<string, Interview[]>>(
    (grouped, interview) => {
      const dateKey = getDateKey(new Date(interview.scheduled_at));
      grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), interview]);
      return grouped;
    },
    new Map(),
  );
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const heading = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  return (
    <section aria-labelledby="interview-calendar-heading" className="rounded-xl border border-line bg-surface/90 shadow-sm backdrop-blur-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <h1 id="interview-calendar-heading" className="font-display text-2xl font-medium tracking-[-0.03em] text-ink">
          {heading}
        </h1>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous month" onClick={() => onMonthChange(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))} className="inline-flex size-9 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button type="button" onClick={() => onMonthChange(startOfMonth(today))} className="rounded-md border border-line px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            Today
          </button>
          <button type="button" aria-label="Next month" onClick={() => onMonthChange(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))} className="inline-flex size-9 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <div role="grid" aria-label={`${heading} interview calendar`} className="min-w-[52rem]">
          <div role="row" className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} role="columnheader" className="px-3 py-3 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayKey = getDateKey(day);
              const dayInterviews = interviewsByDate.get(dayKey) ?? [];
              const isCurrentMonth = day.getMonth() === monthStart.getMonth();
              const isToday = sameCalendarDate(day, today);
              const label = `${isToday ? "Today, " : ""}${formatDayLabel(day)}`;

              return (
                <section key={dayKey} role="gridcell" aria-label={label} className={`min-h-32 border-b border-r border-line p-2.5 ${isCurrentMonth ? "bg-canvas/35" : "bg-canvas/15 text-muted"} ${isToday ? "bg-primary/10" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <time dateTime={dayKey} className={`grid size-7 place-items-center rounded-full font-mono text-xs font-semibold ${isToday ? "bg-primary text-white" : isCurrentMonth ? "text-ink" : "text-muted"}`}>
                      {day.getDate()}
                    </time>
                    {isToday ? <span className="sr-only">Today</span> : null}
                    {dayInterviews.length > 0 ? <span aria-label={`${dayInterviews.length} interviews`} className="size-1.5 rounded-full bg-primary" /> : null}
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayInterviews.slice(0, MAX_VISIBLE_EVENTS).map((interview) => {
                      const application = applicationLabels.get(interview.job_application_id);
                      const company = application?.company ?? "Untitled application";
                      const position = application?.position ?? "Unknown position";
                      return <InterviewEventPopover key={interview.id} company={company} interview={interview} onOpenApplication={onOpenApplication} position={position} />;
                    })}
                    {dayInterviews.length > MAX_VISIBLE_EVENTS ? <p className="px-2 font-mono text-[0.625rem] font-semibold text-muted">+{dayInterviews.length - MAX_VISIBLE_EVENTS} more</p> : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
