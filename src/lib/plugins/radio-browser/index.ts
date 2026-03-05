import { Capability, type Backend, type BackendMetadata, type ResourceResolver } from '$lib/backends/types';
import type { RadioStation, RadioCountry, RadioTag } from '$lib/backends/models/radioStation';
import type { QueueItem } from '$lib/stores/unifiedQueue.svelte';
import {
	searchStations,
	topStations,
	getCountries,
	getTags,
	registerClick
} from './client';

const BACKEND_ID = 'radio-browser';
const IMG_PREFIX = 'radiobrowser-image://';

function prefixFavicon(favicon: string): string {
	return favicon ? IMG_PREFIX + favicon : '';
}

function addBackendId<T extends { favicon?: string }>(item: T): T & { backendId: string } {
	return {
		...item,
		backendId: BACKEND_ID,
		favicon: item.favicon ? prefixFavicon(item.favicon) : (item.favicon as string)
	};
}

export class RadioBrowserBackend implements Backend {
	readonly id = BACKEND_ID;
	readonly capabilities = new Set<Capability>([Capability.InternetRadio]);
	private _connected = false;

	readonly resolvers: ResourceResolver[] = [
		{
			protocol: 'radiobrowser-image',
			resolve(resourcePath) {
				return { url: resourcePath };
			}
		}
	];

	readonly metadata: BackendMetadata = {
		name: 'Radio Browser',
		description: 'Access 45,000+ internet radio stations from radio-browser.info',
		icon: 'radio',
		version: '1.0.0',
		author: 'Built-in',
		configFields: [],
		brandColor: '#2196F3'
	};

	async connect(): Promise<void> {
		this._connected = true;
	}

	async disconnect(): Promise<void> {
		this._connected = false;
	}

	isConnected(): boolean {
		return this._connected;
	}

	supports(capability: Capability): boolean {
		return this.capabilities.has(capability);
	}

	async searchRadioStations(params: {
		name?: string;
		tag?: string;
		country?: string;
		limit?: number;
		offset?: number;
	}): Promise<RadioStation[]> {
		const results = await searchStations(params);
		return results.map(addBackendId);
	}

	async getTopRadioStations(category: string, count: number): Promise<RadioStation[]> {
		const results = await topStations(category, count);
		return results.map(addBackendId);
	}

	async getRadioCountries(): Promise<RadioCountry[]> {
		return getCountries();
	}

	async getRadioTags(limit: number): Promise<RadioTag[]> {
		return getTags(limit);
	}

	async getRadioStreamUrl(streamUrl: string): Promise<string> {
		return `/api/radio/stream?url=${encodeURIComponent(streamUrl)}`;
	}

	async registerRadioClick(uuid: string): Promise<void> {
		registerClick(uuid);
	}

	recordPlay(item: QueueItem): void {
		// Radio play events are emitted by radioStore.handleIcyUpdate on ICY track changes.
		// No-op here to avoid double-emit.
	}
}

export function createBackend(): Backend {
	return new RadioBrowserBackend();
}
