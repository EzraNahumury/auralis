import type { MemberName } from "@/lib/avatars";

export type GroupId = string;
export type GroupStatus = "open" | "collecting" | "active" | "closed";

export interface GroupDef {
  id: GroupId;
  name: string;
  description: string;
  contributionPot: number;          // POT each member deposits per round
  totalRounds: number;
  currentRound: number;
  members: MemberName[];            // 2..4 of the dev accounts
  threshold: number;                // M-of-N multisig
  multisigAddress: string;          // derived from members + threshold
  founder: MemberName;              // who created the group
  roundDays: number;                // cadence
  status: GroupStatus;
  createdAt: number;
}

export const ALL_MEMBERS: MemberName[] = ["Alice", "Bob", "Charlie", "Dave"];

export function defaultThreshold(memberCount: number): number {
  return Math.max(2, Math.ceil(memberCount * 0.66));
}
