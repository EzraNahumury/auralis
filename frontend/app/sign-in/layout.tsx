import { SessionProvider } from "@/components/providers/session-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
