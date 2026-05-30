import { NextResponse } from "next/server";
import { getApi } from "@/lib/chain/server/api";
import { isDevMember, addressOf } from "@/lib/chain/server/signers";
import { signAndWait } from "@/lib/chain/server/sign-and-wait";
import { toPlanck } from "@/lib/chain/format";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  groupId: string;
  requestId: string;
  recipientMember: string;
  amountPot: number;
  members: string[];
}

// //Eve is a standard substrate dev account with genesis funds.
// She is never a group member, so she acts as a neutral treasury proxy
// for the demo — group members' personal wallets are untouched.
async function eveSigner(ss58Prefix: number) {
  await cryptoWaitReady();
  const kr = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
  return kr.addFromUri("//Eve");
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (
    !body.groupId || !body.requestId || !body.recipientMember ||
    !body.amountPot || body.amountPot <= 0 ||
    !Array.isArray(body.members) || body.members.length < 2
  ) {
    return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
  }
  if (!isDevMember(body.recipientMember)) {
    return NextResponse.json({ error: `unknown recipient ${body.recipientMember}` }, { status: 400 });
  }

  try {
    const { api, props } = await getApi();
    const ss58 = props.ss58Prefix;

    const recipientAddress = await addressOf(body.recipientMember, ss58);
    const amount = toPlanck(body.amountPot, props.tokenDecimals);

    // Transfer from Eve (treasury proxy) → recipient.
    // This keeps group members' personal balances untouched while
    // giving the recipient a real on-chain payout.
    const treasury = await eveSigner(ss58);
    const tx = api.tx.balances.transferKeepAlive(recipientAddress, amount);
    const rec = await signAndWait(api, tx, treasury);

    return NextResponse.json({ ok: true, treasury: treasury.address, ...rec });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
