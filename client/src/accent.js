// Готові акцентні кольори. Ключі лишились сумісними зі старими налаштуваннями,
// де замість коду кольору зберігалась назва.
export const PRESET_ACCENTS = [
  { key: 'orange', hex: '#f97316' },
  { key: 'sky', hex: '#4dabf7' },
  { key: 'blue', hex: '#3b82f6' },
  { key: 'green', hex: '#22c55e' },
  { key: 'pink', hex: '#ec4899' },
  { key: 'purple', hex: '#a855f7' },
];

const LEGACY = Object.fromEntries(PRESET_ACCENTS.map((p) => [p.key, p.hex]));
const DEFAULT_HEX = LEGACY.orange;

// Налаштування можуть містити або старий ключ ('orange'), або код кольору ('#4dabf7')
export function resolveAccentHex(value) {
  if (!value) return DEFAULT_HEX;
  if (LEGACY[value]) return LEGACY[value];
  return /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_HEX;
}

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (rgb, target, ratio) => rgb.map((v, i) => v + (target[i] - v) * ratio);

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// Наскільки кожен відтінок розбавлений білим (світліші) або чорним (темніші)
const TINTS = { 50: 0.95, 100: 0.88, 200: 0.75, 300: 0.58, 400: 0.3 };
const SHADES = { 600: 0.12, 700: 0.28 };

// Сприйнята яскравість кольору (0..1) — за нею вибираємо, яким має бути текст на ньому
function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// Повна шкала відтінків з одного кольору + колір тексту, який на ньому читається
export function accentScale(value) {
  const hex = resolveAccentHex(value);
  const rgb = toRgb(hex);

  const scale = { 500: hex };
  for (const [step, ratio] of Object.entries(TINTS)) scale[step] = toHex(mix(rgb, WHITE, ratio));
  for (const [step, ratio] of Object.entries(SHADES)) scale[step] = toHex(mix(rgb, BLACK, ratio));

  // Світлий акцент потребує темного тексту, інакше кнопки стають нечитабельними.
  // Поріг підібраний так, щоб звичні насичені кольори лишались із білим текстом,
  // а перемикання спрацьовувало на пастельних, де білий просто зникає.
  scale.ink = luminance(rgb) > 0.5 ? '#1f2937' : '#ffffff';
  return scale;
}
