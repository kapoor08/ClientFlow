/**
 * Converts a hex color string (e.g. "#1b68a7" or "#fff") to the HSL
 * component string expected by CSS custom properties in this project,
 * e.g. "207 72% 38%".
 *
 * Returns null if the input is not a valid hex color.
 */
export function hexToHslString(hex: string): string | null {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generates the full --cf-brand-* palette from a base hex color.
 * Returns an object with HSL strings for each shade (100–900).
 * Lightness and saturation are mapped relative to the default palette
 * which uses L=38 as the "500" base.
 */
export function generateBrandPalette(hex: string): {
  "900": string;
  "700": string;
  "500": string;
  "300": string;
  "100": string;
} | null {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const lBase = ((max + min) / 2) * 100;
  const sBase =
    delta === 0
      ? 0
      : (delta / (1 - Math.abs(2 * ((max + min) / 2) - 1))) * 100;

  // Map lightness offsets from the default L=38 base
  // Default palette: 900→17, 700→27, 500→38, 300→63, 100→91
  const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const l500 = clamp(Math.round(lBase), 10, 80);
  const l900 = clamp(l500 - 21, 5, 35);
  const l700 = clamp(l500 - 11, 12, 50);
  const l300 = clamp(l500 + 25, 45, 85);
  const l100 = clamp(l500 + 53, 80, 96);

  // Saturation: reduce for lighter shades, similar to default palette
  const s500 = clamp(Math.round(sBase), 20, 100);
  const s900 = clamp(s500 + 3, 20, 100);
  const s700 = clamp(s500 + 1, 20, 100);
  const s300 = clamp(s500 - 17, 15, 100);
  const s100 = clamp(s500 - 4, 15, 100);

  return {
    "900": `${h} ${s900}% ${l900}%`,
    "700": `${h} ${s700}% ${l700}%`,
    "500": `${h} ${s500}% ${l500}%`,
    "300": `${h} ${s300}% ${l300}%`,
    "100": `${h} ${s100}% ${l100}%`,
  };
}

/**
 * Returns true if a hex color is "dark" (luminance < 0.5),
 * useful for deciding whether overlaid text should be white or black.
 */
export function isHexDark(hex: string): boolean {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return false;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.5;
}
