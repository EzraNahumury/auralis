import { AppShell } from "@/components/app-shell/app-shell";
import { ChainProvider } from "@/components/providers/chain-provider";
import {
  RequireSession,
  SessionProvider,
} from "@/components/providers/session-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RequireSession>
        <ChainProvider>
          <AppShell>{children}</AppShell>
        </ChainProvider>
      </RequireSession>
    </SessionProvider>
  );
}
