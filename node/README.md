# Auralis Substrate Node — Railway Deployment

A Dockerized [`substrate-contracts-node`](https://github.com/paritytech/substrate-contracts-node) deployed on Railway. Serves as the Auralis ink! 5.x contracts' dev chain over WebSocket.

The Auralis frontend points its `PORTALDOT_WS` env at this service.

> Uses `prosopo/substrate-contracts-node:v0.41.18dp` — a community-maintained image of the official `substrate-contracts-node`. Parity does not publish an official Docker image, so we pin a known-good community build that supports the pallet-contracts API surface ink! 5.x requires.

---

## Quick deploy (Railway dashboard, ~3 minutes)

1. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → select `auralis` repo.
2. After import, open the new service → **Settings → Source**:
   - **Root Directory:** `node`
3. **Settings → Networking → Generate Domain** to expose a public URL.
4. **Settings → Volumes → Add Volume** with **Mount Path:** `/data` (so chain state survives restarts).
5. Wait for the build (~2 min) and first deploy to finish.
6. Verify the node is up — see [Verify](#verify) below.

That's it. No other configuration required.

---

## Configuration

| Env var       | Default | Notes                                                                                            |
| ------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `PORT`        | `9944`  | Injected by Railway automatically. The binary binds RPC + WebSocket on this port.                |

No other env vars are required for the dev chain.

---

## Connect the frontend

After the Railway domain is provisioned (e.g., `auralis-node.up.railway.app`), set the frontend `PORTALDOT_WS` env to the **WebSocket** URL:

```
PORTALDOT_WS=wss://auralis-node.up.railway.app
```

Set this in **Vercel → Project Settings → Environment Variables** and redeploy the frontend.

---

## Re-deploy the ink! contracts

The Railway node starts with a clean chain. The Auralis contract addresses recorded under `deploy.local.env` (`CONTRACT_*`) belong to the previous chain instance and **will not exist** on the new one. Re-run the contract deploy against the new endpoint:

```bash
cd ../contracts
# Replace WS with your new Railway URL
PORTALDOT_WS=wss://<your-railway-domain> ./deploy.sh   # or scripts/deploy-all.sh
```

Then update `deploy.local.env` (or the deploy output file the frontend reads from) with the new contract addresses, and redeploy the frontend so it picks them up.

---

## Verify

The endpoint only responds on WebSocket; a browser GET will show Railway's 404 page (normal). Two ways to verify the node is live:

### From a shell (Node 18+)

```bash
npx wscat -c wss://<your-railway-domain>
```

You should see `Connected (press CTRL+C to quit)`. Then paste:

```json
{"jsonrpc":"2.0","id":1,"method":"system_chain","params":[]}
```

A valid node replies with `Development` (or your chain's name).

### From a script

```js
import { ApiPromise, WsProvider } from "@polkadot/api";

const api = await ApiPromise.create({
  provider: new WsProvider("wss://<your-railway-domain>"),
});
console.log(await api.rpc.system.chain());
await api.disconnect();
```

---

## Persistence

The container writes chain state to `/data`. **You must mount a Railway volume at `/data`** during initial deploy. Without the volume, every restart wipes all deposits, groups, votes, and the contracts you deployed.

To redeploy after re-attaching a volume mid-life, you'll need to re-deploy your ink! contracts (their address depends on chain state). For a clean reset, **delete the volume** and let the next deploy re-initialize.

---

## Cost

`substrate-contracts-node --dev` uses ~256–384 MB RAM and ~0.1–0.3 vCPU steady state. This fits the Railway Hobby plan's $5/month credit comfortably (≈ $3–4/month at idle).

---

## Security warning

`--rpc-methods=unsafe` is enabled because Auralis uses the dev keystore for automated test signing. **This is acceptable only for a hackathon dev chain.** Anyone with the WebSocket URL can:

- Inspect every transaction
- Submit arbitrary extrinsics
- Read full chain state

Do **NOT** point production user wallets or real funds at this node. For a real mainnet release, swap to:

- `--rpc-methods=safe`
- Remove `--rpc-external` and put a reverse proxy in front with auth
- Use Portaldot's official mainnet RPC

---

## Local development equivalent

```bash
docker build -t auralis-node ./node
docker run --rm -p 9944:9944 -v $PWD/data:/data auralis-node
```

Frontend will then talk to `ws://127.0.0.1:9944`.
