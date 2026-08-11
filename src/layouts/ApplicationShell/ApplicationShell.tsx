import type { PropsWithChildren, ReactNode } from "react";

type ApplicationShellProps = PropsWithChildren<{
  navigation: ReactNode;
}>;

export function ApplicationShell({
  children,
  navigation,
}: ApplicationShellProps) {
  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {navigation}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
