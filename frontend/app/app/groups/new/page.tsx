"use client";

import Link from "next/link";

export default function NewGroup() {
  return (
    <div className="flex flex-col gap-10">
      <header>
        <Link
          href="/app/groups"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Groups
        </Link>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Start a new group
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Group creation needs a wallet signer — we&rsquo;ll add this when
          Portaldot wallet extensions land. For now you can play with the
          existing RT 03 demo to see how a round runs end-to-end.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-border bg-[#141414] px-6 py-8 text-[14px] leading-relaxed text-fg-muted">
        <p>What this form will collect when ready:</p>
        <ul className="mt-4 space-y-1.5 pl-4 text-[13px]">
          <li>• Group name and where it&rsquo;s based.</li>
          <li>• How much each member contributes per round.</li>
          <li>• How often the rounds happen.</li>
          <li>• Members and how many approvals are needed to pay out.</li>
        </ul>
      </div>

      <div>
        <Link
          href="/app/groups/g_rt03"
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[14px] font-medium text-bg transition-transform hover:-translate-y-0.5"
        >
          Open the demo group
        </Link>
      </div>
    </div>
  );
}
