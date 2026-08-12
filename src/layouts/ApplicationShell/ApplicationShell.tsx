import {
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useState,
} from "react";
import { AnimatedSidebarProvider } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";

export const SIDEBAR_STORAGE_KEY = "jobuddy:sidebar-expanded";

type ApplicationShellProps = PropsWithChildren<{
  navigation: ReactNode;
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
}: ApplicationShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(readInitialSidebarState);

  const handleSidebarOpenChange = (nextOpen: boolean) => {
    setIsSidebarOpen(nextOpen);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextOpen));
    } catch {
      // Persistence is optional; the controlled in-memory state remains authoritative.
    }
  };

  return (
    <AnimatedSidebarProvider
      open={isSidebarOpen}
      onOpenChange={handleSidebarOpenChange}
      style={{
        "--sidebar-width": "14rem",
        "--sidebar-width-icon": "4.25rem",
      } as CSSProperties}
    >
      {navigation}
      <main className="min-w-0 flex-1">{children}</main>
    </AnimatedSidebarProvider>
  );
}
