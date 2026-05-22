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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEIGHT = 5_000_000_000n;

interface Body {
  groupId: string;
  requestId: string;
  signerMember: string;        // who is approving
  members: string[];           // group signatories
  threshold: number;
  callHash: string;
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
    !body.callHash ||
    typeof body.timepointHeight !== "number" ||
    typeof body.timepointIndex !== "number" ||
    !Array.isArray(body.members) ||
    body.members.length < 2 ||
    !body.threshold
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

    const tx = api.tx.multisig.approveAsMulti(
      body.threshold,
      others,
      { height: body.timepointHeight, index: body.timepointIndex },
      body.callHash,
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
