// Ephemeral UI state — not persisted, not SSR-relevant

let artFullscreen = $state(false);
let showCreatePlaylist = $state(false);
let fullscreenVisualizer = $state(false);
let pinnedSubmenus = $state<Record<string, boolean>>({});
let playlistVersion = $state(0);

// Art fullscreen
export function getArtFullscreen(): boolean {
	return artFullscreen;
}

export function setArtFullscreen(value: boolean) {
	artFullscreen = value;
}

// Create playlist modal
export function getShowCreatePlaylist(): boolean {
	return showCreatePlaylist;
}

export function toggleCreatePlaylist() {
	showCreatePlaylist = !showCreatePlaylist;
}

export function closeCreatePlaylist() {
	showCreatePlaylist = false;
}

// Fullscreen visualizer
export function getFullscreenVisualizer(): boolean {
	return fullscreenVisualizer;
}

export function setFullscreenVisualizer(value: boolean) {
	fullscreenVisualizer = value;
}

// Submenu pinned state
export function isSubmenuPinned(key: string): boolean {
	return pinnedSubmenus[key] ?? false;
}

export function toggleSubmenuPin(key: string) {
	pinnedSubmenus = { ...pinnedSubmenus, [key]: !pinnedSubmenus[key] };
}

// Playlist version — bumped when playlists are created/deleted to trigger re-fetches
export function getPlaylistVersion(): number {
	return playlistVersion;
}

export function bumpPlaylistVersion() {
	playlistVersion++;
}
