export const DEFAULT_ACCENT_COLOR = '#5965db';

export function isAccentColor(value: string | null): value is string {
  return value !== null && /^#[\da-f]{6}$/i.test(value);
}

export function applyAccentColor(color: string): void {
  if (!isAccentColor(color)) return;

  const channels = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const root = document.documentElement;
  root.style.setProperty('--app-accent', color);
  root.style.setProperty('--app-accent-foreground', luminance > 0.42 ? '#172033' : '#ffffff');
}
