import { useMemo, useState } from "react";
import { WheelPicker } from "../../atoms/WheelPicker/WheelPicker";

type DateWheelPickerProps = {
  onCancel: () => void;
  onConfirm: (value: string) => void;
  value: string;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(2026, index, 1),
  ),
  value: String(index + 1),
}));

const yearOptions = Array.from(
  { length: new Date().getFullYear() - 1970 + 11 },
  (_, index) => String(1970 + index),
);

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const now = new Date();
  return match
    ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
    : { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DateWheelPicker({
  onCancel,
  onConfirm,
  value,
}: DateWheelPickerProps) {
  const initialDate = parseDate(value);
  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [day, setDay] = useState(initialDate.day);
  const days = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, index) => String(index + 1)),
    [month, year],
  );

  const selectedDay = Math.min(day, days.length);

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Applied date picker"
        className="w-full max-w-md rounded-lg border border-line bg-canvas p-4 shadow-[0_20px_48px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-ink">Applied date</h3>
          <output className="text-sm tabular-nums text-muted">
            {toIsoDate(year, month, selectedDay)}
          </output>
        </div>
        <div className="mt-4 grid grid-cols-[1.35fr_0.75fr_0.9fr] gap-2">
          <WheelPicker
            aria-label="Month"
            className="border-line bg-surface text-sm"
            itemHeight={34}
            options={monthOptions}
            value={String(month)}
            onValueChange={(nextMonth) => {
              const nextMonthNumber = Number(nextMonth);
              setMonth(nextMonthNumber);
              setDay((currentDay) =>
                Math.min(currentDay, daysInMonth(year, nextMonthNumber)),
              );
            }}
          />
          <WheelPicker
            aria-label="Day"
            className="border-line bg-surface text-sm"
            itemHeight={34}
            options={days}
            value={String(selectedDay)}
            onValueChange={(nextDay) => setDay(Number(nextDay))}
          />
          <WheelPicker
            aria-label="Year"
            className="border-line bg-surface text-sm"
            itemHeight={34}
            options={yearOptions}
            value={String(year)}
            onValueChange={(nextYear) => {
              const nextYearNumber = Number(nextYear);
              setYear(nextYearNumber);
              setDay((currentDay) =>
                Math.min(currentDay, daysInMonth(nextYearNumber, month)),
              );
            }}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-ink transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => onConfirm(toIsoDate(year, month, selectedDay))}
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
