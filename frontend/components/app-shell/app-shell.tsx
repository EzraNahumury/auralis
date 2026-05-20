import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1">
          <div className="mx-auto max-w-[860px] px-8 py-14 lg:px-12 lg:py-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
