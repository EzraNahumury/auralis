import "server-only";
import { getApi } from "./api";

export async function getBalance(address: string): Promise<{
  free: string;
  reserved: string;
  freePot: number;
}> {
  const { api, props } = await getApi();
  const info = (await api.query.system.account(address)) as unknown as {
    data: { free: { toString(): string }; reserved: { toString(): string } };
  };
  const free = BigInt(info.data.free.toString());
  const reserved = BigInt(info.data.reserved.toString());
  const factor = 10n ** BigInt(props.tokenDecimals);
  const freePot = Number(free / factor) + Number(free % factor) / Number(factor);
  return {
    free: free.toString(),
    reserved: reserved.toString(),
    freePot,
  };
}
