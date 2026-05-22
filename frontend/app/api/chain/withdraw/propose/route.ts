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
  signerMember: string;     // who is proposing (usually the requester)
  members: string[];        // all signatories of the group
  threshold: number;
  recipientMember: string;  // who receives the pot
  amountPot: number;
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
    const { sortedSignatories, multisigAddress } = deriveMultisigAddressServer(
      memberAddresses,
      body.threshold,
      ss58
    );

    const signer = await signerFor(body.signerMember, ss58);
    const recipientAddress = await addressOf(body.recipientMember, ss58);

    const amount = toPlanck(body.amountPot, props.tokenDecimals);
    const innerCall = api.tx.balances.transferKeepAlive(
      recipientAddress,
      amount
    );
    const callHash = innerCall.method.hash.toHex();

    // Idempotency: if the same callHash is already pending against this
    // multisig, just return the existing timepoint instead of double-proposing.
    const existing = (await api.query.multisig.multisigs(
      multisigAddress,
      callHash
    )) as unknown as { isSome: boolean; unwrap(): { when: { height: { toNumber(): number }; index: { toNumber(): number } } } };

    if (existing.isSome) {
      const m = existing.unwrap();
      return NextResponse.json({
        ok: true,
        skipped: true,
        multisigAddress,
        callHash,
        timepointHeight: m.when.height.toNumber(),
        timepointIndex: m.when.index.toNumber(),
      });
    }

    const others = otherSignatoriesServer(sortedSignatories, signer.address);
    const proposeTx = api.tx.multisig.approveAsMulti(
      body.threshold,
      others,
      null,
      callHash,
      MAX_WEIGHT
    );
    const rec = await signAndWait(api, proposeTx, signer);

    // Read the timepoint back from chain.
    const fresh = (await api.query.multisig.multisigs(
      multisigAddress,
      callHash
    )) as unknown as { isSome: boolean; unwrap(): { when: { height: { toNumber(): number }; index: { toNumber(): number } } } };
    if (!fresh.isSome) {
      return NextResponse.json(
        { error: "multisig record not found after proposing" },
        { status: 502 }
      );
    }
    const t = fresh.unwrap();

    return NextResponse.json({
      ok: true,
      multisigAddress,
      callHash,
      timepointHeight: t.when.height.toNumber(),
      timepointIndex: t.when.index.toNumber(),
      ...rec,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
