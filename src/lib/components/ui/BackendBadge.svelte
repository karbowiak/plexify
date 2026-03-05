<script lang="ts">
	interface Props {
		backendId: string;
		size?: number;
		class?: string;
	}

	let { backendId, size = 16, class: className = '' }: Props = $props();
</script>

{#if backendId === 'demo'}
	<!-- Deezer equalizer bars -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 16 16"
		fill="none"
		class={className}
	>
		<rect x="1" y="9" width="3" height="6" rx="0.5" fill="#A238FF" />
		<rect x="5.5" y="5" width="3" height="10" rx="0.5" fill="#A238FF" />
		<rect x="10" y="1" width="3" height="14" rx="0.5" fill="#A238FF" />
	</svg>
{:else if backendId === 'radio-browser'}
	<!-- Radio wave / antenna -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 16 16"
		fill="none"
		class={className}
	>
		<circle cx="8" cy="12" r="2" fill="#2196F3" />
		<path
			d="M4.5 9.5a5 5 0 0 1 7 0"
			stroke="#2196F3"
			stroke-width="1.5"
			stroke-linecap="round"
			fill="none"
		/>
		<path
			d="M2.5 7a8 8 0 0 1 11 0"
			stroke="#2196F3"
			stroke-width="1.5"
			stroke-linecap="round"
			fill="none"
		/>
	</svg>
{:else if backendId === 'podcast-index'}
	<!-- Podcast waveform / mic -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 16 16"
		fill="none"
		class={className}
	>
		<rect x="6" y="1" width="4" height="8" rx="2" fill="#F43F5E" />
		<path
			d="M4 7a4 4 0 0 0 8 0"
			stroke="#F43F5E"
			stroke-width="1.5"
			stroke-linecap="round"
			fill="none"
		/>
		<line x1="8" y1="11" x2="8" y2="14" stroke="#F43F5E" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else}
	<!-- Generic music note fallback -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 16 16"
		fill="none"
		class={className}
	>
		<circle cx="5" cy="12" r="2.5" fill="currentColor" opacity="0.7" />
		<path d="M7.5 12V3l6-2v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.7" fill="none" />
		<circle cx="13.5" cy="10" r="2.5" fill="currentColor" opacity="0.7" />
	</svg>
{/if}
