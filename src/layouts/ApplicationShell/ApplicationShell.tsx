import {
  type CSSProperties,
  type MouseEvent,
  type PropsWithChildren,
  useRef,
  type ReactNode,
  useState,
} from "react";
import { AnimatedSidebarProvider } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { AddJobApplicationModal } from "../../components/organisms/AddJobApplicationModal/AddJobApplicationModal";
import type { JobApplicationFormData } from "../../components/molecules/JobApplicationFormFields/jobApplicationFormSchema";
import { useCreateJobApplication, useJobApplications } from "../../hooks/useJobApplications";
import { ThemeProvider, ThemeToggle } from "../../components/atoms/ThemeToggle/ThemeToggle";
import { useToast } from "../../components/atoms/AnimatedToastStack/AnimatedToastStack";

export const SIDEBAR_STORAGE_KEY = "jobuddy:sidebar-expanded";

type ApplicationShellProps = PropsWithChildren<{
  navigation: ReactNode;
  onAddApplication?: (opener: HTMLButtonElement) => void;
}>;

function readInitialSidebarState() {
  try {
    const storedValue = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return storedValue === "false" ? false : true;
  } catch {
    return true;
  }
}

export function ApplicationShell({
  children,
  navigation,
  onAddApplication,
}: ApplicationShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(readInitialSidebarState);
  const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);
  const addOpenerRef = useRef<HTMLButtonElement | null>(null);
  const applicationsQuery = useJobApplications();
  const createApplication = useCreateJobApplication();
  const toast = useToast();

  const handleSidebarOpenChange = (nextOpen: boolean) => {
    setIsSidebarOpen(nextOpen);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextOpen));
    } catch {
      // Persistence is optional; the controlled in-memory state remains authoritative.
    }
  };

  function handleShellClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (onAddApplication) return;
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('button[aria-label="Add application"]');
    if (!button || button.disabled) return;
    createApplication.reset();
    addOpenerRef.current = button;
    setIsGlobalAddOpen(true);
  }

  async function handleGlobalCreate(input: JobApplicationFormData) {
    const destinationOrderIndexes = (applicationsQuery.data ?? [])
      .filter((application) => application.status === input.status)
      .map((application) => application.order_index);
    const result = await createApplication.mutateAsync({
      ...input,
      order_index: Math.max(0, ...destinationOrderIndexes) + 1_000,
    });
    toast.success("Application added", `${input.company} · ${input.position}`);
    return result;
  }

  return (
    <ThemeProvider>
      <div onClickCapture={handleShellClickCapture}>
      <AnimatedSidebarProvider
        open={isSidebarOpen}
        onOpenChange={handleSidebarOpenChange}
        className="bg-canvas text-ink"
        style={{
          "--sidebar-width": "14rem",
          "--sidebar-width-icon": "4.25rem",
        } as CSSProperties}
      >
        <ThemeToggle className="fixed bottom-4 right-4 z-30 md:bottom-auto md:right-5 md:top-3 md:z-50" />
        {navigation}
        <main className="min-w-0 flex-1">{children}</main>
        {isGlobalAddOpen ? (
          <AddJobApplicationModal
            hasCreateError={createApplication.isError}
            isCreating={createApplication.isPending}
            onClose={() => {
              setIsGlobalAddOpen(false);
              addOpenerRef.current?.focus();
            }}
            onCreate={handleGlobalCreate}
          />
        ) : null}
      </AnimatedSidebarProvider>
      </div>
    </ThemeProvider>
  );
}
