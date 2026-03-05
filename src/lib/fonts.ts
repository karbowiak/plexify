const FONT_OPTIONS = ['System', 'Inter', 'Geist', 'Montserrat', 'Nunito'] as const;
type FontOption = (typeof FONT_OPTIONS)[number];

export function getFontFamily(font: string): string {
	if (font === 'System') {
		return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
	}
	return `'${font}', -apple-system, BlinkMacSystemFont, sans-serif`;
}
