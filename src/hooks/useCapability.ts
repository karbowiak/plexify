import { useProviderStore } from "../stores/providerStore"
import type { ProviderCapabilities } from "../providers/types"

export function useCapability(cap: keyof ProviderCapabilities): boolean {
  return useProviderStore(s => s.capabilities?.[cap] ?? false)
}
