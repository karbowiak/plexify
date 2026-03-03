import type { BackendDefinition, MetadataBackendDefinition } from "./types"

const backends: BackendDefinition[] = []
const metadataBackends: MetadataBackendDefinition[] = []

export function registerBackend(backend: BackendDefinition) {
  if (!backends.some(b => b.id === backend.id)) {
    backends.push(backend)
  }
}

export function getBackends(): readonly BackendDefinition[] {
  return backends
}

export function getBackend(id: string): BackendDefinition | undefined {
  return backends.find(b => b.id === id)
}

export function registerMetadataBackend(backend: MetadataBackendDefinition) {
  if (!metadataBackends.some(b => b.id === backend.id)) {
    metadataBackends.push(backend)
  }
}

export function getMetadataBackends(): readonly MetadataBackendDefinition[] {
  return metadataBackends
}

export function getMetadataBackend(id: string): MetadataBackendDefinition | undefined {
  return metadataBackends.find(b => b.id === id)
}
