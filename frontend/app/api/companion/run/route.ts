// Bridges the browser UI to the actual companion script. POST starts the
// 5-step Arisan flow via the companion's `npm start` and streams the
// progress back as Server-Sent Events so the frontend can render the live
// transaction log without having to bundle @polkadot/api itself.

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SSEController {
  enqueue: (event: string, data: unknown) => void;
  close: () => void;
}

function makeStream(handler: (ctl: SSEController) => Promise<void>) {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      const ctl: SSEController = {
        enqueue(event, data) {
          if (closed) return;
          try {
            controller.enqueue(
              enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // Controller has been closed externally (client disconnect).
            closed = true;
          }
        },
        close() {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
        },
      };
      try {
        await handler(ctl);
      } catch (err: unknown) {
        ctl.enqueue("error", {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        ctl.close();
      }
    },
  });
}

function companionDir() {
  // Frontend's cwd at runtime is `frontend/`. Companion sits next to it.
  return path.resolve(process.cwd(), "..", "companion");
}

export async function POST() {
  const dir = companionDir();

  const stream = makeStream(async (ctl) => {
    ctl.enqueue("start", { dir });

    // Stream parser state. The companion's stdout follows a consistent
    // pattern from companion/src/index.ts:
    //   Step N/5: <description>
    //     ✓ tx: 0x...
    //     ✓ block #12345
    // We detect those exact markers and emit structured events.
    let currentStep = 0;
    let exited = false;

    const child = spawn("npm", ["start", "--silent"], {
      cwd: dir,
      shell: true,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    function parseLine(line: string) {
      ctl.enqueue("log", { line });

      const stepMatch = line.match(/Step\s+(\d)\/5:\s*(.*)/i);
      if (stepMatch) {
        currentStep = Number(stepMatch[1]);
        ctl.enqueue("step:start", {
          step: currentStep,
          description: stepMatch[2].trim(),
        });
        return;
      }

      const skipMatch = line.match(/Step\s+(\d)\/5:\s*⏭/i);
      if (skipMatch) {
        const step = Number(skipMatch[1]);
        ctl.enqueue("step:skip", { step });
        return;
      }

      const txMatch = line.match(/✓\s*tx:\s*(0x[0-9a-fA-F]+)/);
      if (txMatch && currentStep > 0) {
        ctl.enqueue("step:tx", {
          step: currentStep,
          txHash: txMatch[1],
        });
        return;
      }

      const blockMatch = line.match(/✓\s*block\s*#(\d+)/i);
      if (blockMatch && currentStep > 0) {
        ctl.enqueue("step:block", {
          step: currentStep,
          blockNumber: Number(blockMatch[1]),
        });
        return;
      }

      const timepointMatch = line.match(
        /timepoint:\s*block\s*#(\d+),\s*extrinsic\s*#(\d+)/i
      );
      if (timepointMatch && currentStep > 0) {
        ctl.enqueue("step:timepoint", {
          step: currentStep,
          blockNumber: Number(timepointMatch[1]),
          extrinsicIndex: Number(timepointMatch[2]),
        });
        return;
      }

      const balanceMatch = line.match(/(Multisig pot|Dave)\s*:\s*(\S+\s*POT)/i);
      if (balanceMatch) {
        ctl.enqueue("balance", {
          who: balanceMatch[1],
          amount: balanceMatch[2],
        });
        return;
      }
    }

    let stdoutBuf = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
      let nl;
      while ((nl = stdoutBuf.indexOf("\n")) !== -1) {
        const line = stdoutBuf.slice(0, nl).replace(/\r$/, "");
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (line.trim()) parseLine(line);
      }
    });

    let stderrBuf = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
      // npm prints harmless warnings to stderr; we surface them as logs.
      let nl;
      while ((nl = stderrBuf.indexOf("\n")) !== -1) {
        const line = stderrBuf.slice(0, nl).replace(/\r$/, "");
        stderrBuf = stderrBuf.slice(nl + 1);
        if (line.trim()) ctl.enqueue("log", { line, stream: "stderr" });
      }
    });

    child.on("error", (err) => {
      ctl.enqueue("error", { message: err.message });
    });

    await new Promise<void>((resolve) => {
      child.on("exit", async (code) => {
        exited = true;
        if (stdoutBuf.trim()) parseLine(stdoutBuf.trim());

        if (code === 0) {
          try {
            const raw = await readFile(
              path.join(dir, "tx-proof.json"),
              "utf-8"
            );
            const proof = JSON.parse(raw);
            ctl.enqueue("complete", { exitCode: code, proof });
          } catch (err: unknown) {
            ctl.enqueue("error", {
              message:
                "Companion exited 0 but tx-proof.json could not be read: " +
                (err instanceof Error ? err.message : String(err)),
            });
          }
        } else {
          ctl.enqueue("error", {
            message: `Companion exited with code ${code}`,
            exitCode: code,
          });
        }
        resolve();
      });
    });

    // Safety: if controller closes before exit (client disconnect), kill
    // the spawned process so we don't leak.
    if (!exited) {
      try {
        child.kill();
      } catch {
        // ignore
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
