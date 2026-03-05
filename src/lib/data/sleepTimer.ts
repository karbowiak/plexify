import * as m from '$lib/paraglide/messages.js';

export const sleepTimerOptions = [
	{ label: () => m.sleep_timer_15min(), value: '15m' },
	{ label: () => m.sleep_timer_30min(), value: '30m' },
	{ label: () => m.sleep_timer_45min(), value: '45m' },
	{ label: () => m.sleep_timer_1hour(), value: '1h' },
	{ label: () => m.sleep_timer_end_of_track(), value: 'eot' }
] as const;
