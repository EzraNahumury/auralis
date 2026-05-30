import { NextResponse } from "next/server";
import { getApi } from "@/lib/chain/server/api";
import {
  isDevMember,
  signerFor,
  addressOf,
} from "@/lib/chain/server/signers";
import {
  deriveMultisigAddressServer,
  otherSignatoriesServer,
} from "@/lib/chain/server/multisig";
import { signAndWait } from "@/lib/chain/server/sign-and-wait";
import { toPlanck } from "@/lib/chain/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEIGHT = 5_000_000_000n;

interface Body {
  groupId: string;
  requestId: string;
  signerMember: string;        // final approver who triggers execution
  members: string[];           // group signatories
  threshold: number;
  recipientMember: string;     // who receives the pot
  amountPot: number;
  timepointHeight: number;
  timepointIndex: number;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (
    !body.groupId ||
    !body.requestId ||
    typeof body.timepointHeight !== "number" ||
    typeof body.timepointIndex !== "number" ||
    !Array.isArray(body.members) ||
    body.members.length < 2 ||
    !body.threshold ||
    !body.amountPot ||
    body.amountPot <= 0
  ) {
    return NextResponse.json({ error: "missing or invalid fields" }, {
      status: 400,
    });
  }
  if (!isDevMember(body.signerMember)) {
    return NextResponse.json(
      { error: `unknown signer ${body.signerMember}` },
      { status: 400 }
    );
  }
  if (!isDevMember(body.recipientMember)) {
    return NextResponse.json(
      { error: `unknown recipient ${body.recipientMember}` },
      { status: 400 }
    );
  }
  for (const m of body.members) {
    if (!isDevMember(m)) {
      return NextResponse.json(
        { error: `unknown group member ${m}` },
        { status: 400 }
      );
    }
  }

  try {
    const { api, props } = await getApi();
    const ss58 = props.ss58Prefix;
    const memberAddresses = await Promise.all(
      body.members.map((m) =>
        addressOf(m as Parameters<typeof addressOf>[0], ss58)
      )
    );
    const { sortedSignatories } = deriveMultisigAddressServer(
      memberAddresses,
      body.threshold,
      ss58
    );

    const signer = await signerFor(body.signerMember, ss58);
    const others = otherSignatoriesServer(sortedSignatories, signer.address);
    const recipientAddress = await addressOf(body.recipientMember, ss58);

    // Re-construct the same inner call exactly as the propose phase did,
    // so the call hash matches what's pending in the multisig.
    const amount = toPlanck(body.amountPot, props.tokenDecimals);
    const innerCall = api.tx.balances.transferKeepAlive(
      recipientAddress,
      amount
    );
    const callData = innerCall.method.toHex();

    // pallet-multisig absent on substrate-contracts-node — simulate execution.
    if (!api.tx.multisig) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        txHash: "0x" + "0".repeat(64),
        blockHash: "0x" + "0".repeat(64),
        blockNumber: body.timepointHeight + 1,
      });
    }

    const tx = api.tx.multisig.asMulti(
      body.threshold,
      others,
      { height: body.timepointHeight, index: body.timepointIndex },
      callData,
      false,
      MAX_WEIGHT
    );
    const rec = await signAndWait(api, tx, signer);

    return NextResponse.json({
      ok: true,
      ...rec,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
