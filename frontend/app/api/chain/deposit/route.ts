import { NextResponse } from "next/server";
import { getApi } from "@/lib/chain/server/api";
import { isDevMember, signerFor } from "@/lib/chain/server/signers";
import { signAndWait } from "@/lib/chain/server/sign-and-wait";
import { toPlanck } from "@/lib/chain/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  groupId: string;
  member: string;
  multisigAddress: string;
  amountPot: number;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.groupId || !body.multisigAddress || !body.amountPot) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (!isDevMember(body.member)) {
    return NextResponse.json(
      { error: `unknown member ${body.member}` },
      { status: 400 }
    );
  }
  if (body.amountPot <= 0) {
    return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
  }

  try {
    const { api, props } = await getApi();
    const signer = await signerFor(body.member, props.ss58Prefix);
    const amount = toPlanck(body.amountPot, props.tokenDecimals);
    const tx = api.tx.balances.transferKeepAlive(
      body.multisigAddress,
      amount
    );
    const rec = await signAndWait(api, tx, signer);
    return NextResponse.json({
      ok: true,
      groupId: body.groupId,
      member: body.member,
      amountPot: body.amountPot,
      ...rec,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
