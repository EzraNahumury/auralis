import { AppShell } from "@/components/app-shell/app-shell";
import { ChainProvider } from "@/components/providers/chain-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChainProvider>
      <AppShell>{children}</AppShell>
    </ChainProvider>
  );
}
