const KEYS = ["base", "robinhood", "arc"] as const;
export type ChainKey = (typeof KEYS)[number];
export const CHAIN_KEYS: ChainKey[] = [...KEYS];
export const DEFAULT_CHAIN: ChainKey = "robinhood";

export const CHAIN_IDS: Record<ChainKey, number> = { base: 8453, robinhood: 4663, arc: 5042 };
export const CHAIN_LABELS: Record<ChainKey, string> = { base: "Base", robinhood: "Robinhood Chain", arc: "Arc" };
export const CHAIN_SHORT: Record<ChainKey, string> = { base: "Base", robinhood: "Robinhood", arc: "Arc" };
export const EXPLORERS: Record<ChainKey, { url: string; name: string }> = {
  base: { url: "https://basescan.org", name: "Basescan" },
  robinhood: { url: "https://robinhoodchain.blockscout.com", name: "Blockscout" },
  arc: { url: "https://explorer.arc.io", name: "Arc Explorer" },
};

export function isChainKey(v: unknown): v is ChainKey {
  return typeof v === "string" && (KEYS as readonly string[]).includes(v);
}
export function chainKeyOf(id: number | undefined | null): ChainKey | null {
  return CHAIN_KEYS.find((k) => CHAIN_IDS[k] === id) ?? null;
}
export function chainKeyOr<F extends ChainKey | null>(v: unknown, fallback: F): ChainKey | F {
  return isChainKey(v) ? v : fallback;
}
export function chainList(conj: "or" | "and" | "&" = "or", labels: Record<ChainKey, string> = CHAIN_LABELS): string {
  const names = CHAIN_KEYS.map((k) => labels[k]);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} ${conj} ${names[names.length - 1]}`;
}
export const RPC_ENV_NAME: Record<ChainKey, string> = { base: "BASE_RPC_URL", robinhood: "ROBINHOOD_RPC_URL", arc: "ARC_RPC_URL" };
export const CHAIN_KEY_PATTERN = CHAIN_KEYS.join("|");