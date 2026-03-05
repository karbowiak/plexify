export function formatDuration(ms: number): string {
	if (!ms) return '';
	const totalSec = Math.floor(ms / 1000);
	if (totalSec >= 3600) {
		const h = Math.floor(totalSec / 3600);
		const m = Math.floor((totalSec % 3600) / 60);
		const s = totalSec % 60;
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatBitrate(kbps: number | null): string {
	if (kbps == null) return '';
	if (kbps >= 1000) return `${(kbps / 1000).toFixed(1).replace(/\.0$/, '')} Mbps`;
	return `${Math.round(kbps)} kbps`;
}

export function formatSampleRate(hz: number | null): string {
	if (hz == null) return '';
	if (hz >= 1000) return `${(hz / 1000).toFixed(1).replace(/\.0$/, '')} kHz`;
	return `${hz} Hz`;
}

export function formatBitDepth(bits: number | null): string {
	if (bits == null) return '';
	return `${bits}-bit`;
}

export function formatChannels(ch: number | null): string {
	if (ch == null) return '';
	if (ch === 1) return 'Mono';
	if (ch === 2) return 'Stereo';
	return `${ch}ch`;
}

export function formatGainDb(db: number | null): string {
	if (db == null) return '';
	const sign = db >= 0 ? '+' : '';
	return `${sign}${db.toFixed(1)} dB`;
}

export function formatLufs(lufs: number | null): string {
	if (lufs == null) return '';
	return `${lufs.toFixed(1)} LUFS`;
}

export function formatQualityBadge(codec: string | null | undefined, bitrate: number | null | undefined, bitDepth: number | null | undefined, sampleRate: number | null | undefined): string {
	if (!codec) return '';
	const c = codec.toUpperCase();
	const isLossless = ['FLAC', 'ALAC', 'WAV', 'AIFF', 'APE', 'DSD'].includes(c);
	if (isLossless && bitDepth && sampleRate) {
		const sr = sampleRate >= 1000 ? Math.round(sampleRate / 1000) : sampleRate;
		return `${c} ${bitDepth}/${sr}`;
	}
	if (isLossless) return c;
	if (bitrate) return `${c} ${Math.round(bitrate)}k`;
	return c;
}

export function formatNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
	return String(n);
}
