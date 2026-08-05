/**
 * Renders the brand's art-directed placeholder imagery.
 *
 * Real product photography does not exist yet, so rather than shipping grey
 * boxes we generate editorial colour-field compositions in the brand palette.
 * Everything is deterministic: the same slug always produces the same image.
 *
 *   npm run gen:images
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  categories,
  categoryImagePath,
  collections,
  collectionImagePath,
  products,
  productImagePath,
  type Composition,
  type Tone,
} from "../prisma/catalog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

// ---------------------------------------------------------------- palette

type Palette = {
  bg: string;
  mid: string;
  fg: string;
  accent: string;
  ink: string;
};

/**
 * Each tone keeps a wide value range — bg / mid / fg have to read as three
 * distinct steps at thumbnail size, or the grid turns into mush.
 */
const palettes: Record<Tone, Palette> = {
  ink: { bg: "#0C0A0A", mid: "#221E1D", fg: "#453E3A", accent: "#A8412E", ink: "#EDE7DE" },
  rust: { bg: "#5E2015", mid: "#9A3A29", fg: "#C9613C", accent: "#F2EDE6", ink: "#F2EDE6" },
  bone: { bg: "#F3EFE8", mid: "#D9CEBD", fg: "#B4A48C", accent: "#A8412E", ink: "#141211" },
  sand: { bg: "#E5D9C4", mid: "#C2AC8B", fg: "#95795A", accent: "#3A2A1C", ink: "#2C2116" },
  ash: { bg: "#C6C3BF", mid: "#95918C", fg: "#57534F", accent: "#141211", ink: "#141211" },
  clay: { bg: "#503326", mid: "#875F49", fg: "#BC8B69", accent: "#F2EDE6", ink: "#F2EDE6" },
  olive: { bg: "#383B2E", mid: "#5A5B45", fg: "#868864", accent: "#F2EDE6", ink: "#F2EDE6" },
  wine: { bg: "#240E0D", mid: "#54221E", fg: "#8C3A2F", accent: "#D68F7C", ink: "#F2EDE6" },
};

// ---------------------------------------------------------------- rng

/** xmur3 + mulberry32 — small, seeded, and stable across Node versions. */
function makeRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = (h ^= h >>> 16) >>> 0;

  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = ReturnType<typeof makeRandom>;

const between = (r: Rng, min: number, max: number) => min + r() * (max - min);
const pickOne = <T,>(r: Rng, list: T[]) => list[Math.floor(r() * list.length)];
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Blend two hex colours. The backdrop gradient must never drift as far as
 * `mid`, or the objects painted in `mid`/`fg` stop reading against it.
 */
function mix(a: string, b: string, t: number) {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

// ---------------------------------------------------------------- shapes

function drape(r: Rng, p: Palette, w: number, h: number) {
  const bands = Math.floor(between(r, 4, 7));
  const out: string[] = [];
  const colors = [p.mid, p.fg, p.bg, p.mid];

  for (let i = 0; i < bands; i++) {
    const x = (w / bands) * i - w * 0.06;
    const bw = w / bands + w * 0.12;
    const sway = between(r, w * 0.02, w * 0.07);
    const topY = between(r, -h * 0.05, h * 0.12);

    out.push(
      `<path d="M ${round(x)} ${round(topY)}` +
        ` C ${round(x + sway)} ${round(h * 0.35)}, ${round(x - sway)} ${round(h * 0.65)}, ${round(x + sway * 0.4)} ${round(h + 10)}` +
        ` L ${round(x + bw + sway * 0.4)} ${round(h + 10)}` +
        ` C ${round(x + bw - sway)} ${round(h * 0.65)}, ${round(x + bw + sway)} ${round(h * 0.35)}, ${round(x + bw)} ${round(topY)} Z"` +
        ` fill="${colors[i % colors.length]}" opacity="${round(between(r, 0.8, 1))}"/>`,
    );
  }
  // a single accent thread running through the folds
  const ax = between(r, w * 0.25, w * 0.7);
  out.push(
    `<path d="M ${round(ax)} -20 C ${round(ax + w * 0.08)} ${round(h * 0.4)}, ${round(ax - w * 0.08)} ${round(h * 0.7)}, ${round(ax + w * 0.03)} ${round(h + 20)}"` +
      ` fill="none" stroke="${p.accent}" stroke-width="${round(Math.min(w, h) * between(r, 0.004, 0.008))}" opacity="0.85"/>`,
  );
  return out.join("\n    ");
}

function column(r: Rng, p: Palette, w: number, h: number) {
  const cw = w * between(r, 0.36, 0.5);
  const ch = h * between(r, 0.6, 0.78);
  const x = (w - cw) / 2 + between(r, -w * 0.03, w * 0.03);
  const y = (h - ch) / 2 + h * 0.04;

  return [
    `<rect x="0" y="${round(h * 0.8)}" width="${w}" height="${round(h * 0.2)}" fill="${p.mid}"/>`,
    `<ellipse cx="${round(x + cw / 2 + cw * 0.1)}" cy="${round(y + ch)}" rx="${round(cw * 0.72)}" ry="${round(h * 0.022)}" fill="${p.bg}" opacity="0.6"/>`,
    // The hanging form: light side and shadow side, hard-edged
    `<rect x="${round(x)}" y="${round(y)}" width="${round(cw)}" height="${round(ch)}" rx="${round(cw * 0.5)}" fill="${p.fg}"/>`,
    `<rect x="${round(x)}" y="${round(y)}" width="${round(cw * 0.42)}" height="${round(ch)}" rx="${round(cw * 0.3)}" fill="${p.bg}" opacity="0.5"/>`,
    // Rail
    `<line x1="${round(w * 0.12)}" y1="${round(y - h * 0.03)}" x2="${round(w * 0.88)}" y2="${round(y - h * 0.03)}" stroke="${p.accent}" stroke-width="${round(Math.min(w, h) * 0.004)}" opacity="0.8"/>`,
    `<rect x="${round(x + cw * 0.52)}" y="${round(y + ch * 0.16)}" width="${round(cw * 0.05)}" height="${round(ch * 0.62)}" fill="${p.accent}" opacity="0.55"/>`,
  ].join("\n    ");
}

function arc(r: Rng, p: Palette, w: number, h: number) {
  const cx = w * between(r, 0.4, 0.62);
  const cy = h * between(r, 0.4, 0.56);
  const rad = Math.min(w, h) * between(r, 0.34, 0.46);
  const horizon = h * between(r, 0.6, 0.74);

  return [
    // Ground plane, a full value step below the sky
    `<rect x="0" y="${round(horizon)}" width="${w}" height="${round(h - horizon)}" fill="${p.mid}"/>`,
    // The disc, lit from one side
    `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(rad)}" fill="${p.fg}"/>`,
    `<path d="M ${round(cx)} ${round(cy - rad)} A ${round(rad)} ${round(rad)} 0 0 1 ${round(cx)} ${round(cy + rad)} Z" fill="${p.bg}" opacity="0.42"/>`,
    `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(rad)}" fill="none" stroke="${p.accent}" stroke-width="${round(Math.min(w, h) * 0.004)}" opacity="0.8"/>`,
    `<line x1="0" y1="${round(horizon)}" x2="${w}" y2="${round(horizon)}" stroke="${p.accent}" stroke-width="${round(Math.min(w, h) * 0.003)}" opacity="0.7"/>`,
  ].join("\n    ");
}

/** The paper-cut motif from the logo: torn rectangles laid over each other. */
function collage(r: Rng, p: Palette, w: number, h: number) {
  const count = Math.floor(between(r, 4, 7));
  const fills = [p.fg, p.mid, p.accent, p.fg, p.bg];
  const out: string[] = [];

  for (let i = 0; i < count; i++) {
    const rw = w * between(r, 0.22, 0.46);
    const rh = h * between(r, 0.12, 0.3);
    const x = between(r, -w * 0.05, w - rw * 0.7);
    const y = between(r, -h * 0.03, h - rh * 0.6);
    const rot = between(r, -9, 9);
    const fill = fills[i % fills.length];

    // Torn edges: nudge each corner off the rectangle by a few percent.
    const jitter = () => between(r, 0.005, 0.03);
    const poly = [
      `${round(jitter() * 100)}% ${round(jitter() * 100)}%`,
      `${round(100 - jitter() * 100)}% ${round(jitter() * 60)}%`,
      `${round(100 - jitter() * 40)}% ${round(100 - jitter() * 100)}%`,
      `${round(jitter() * 80)}% ${round(100 - jitter() * 60)}%`,
    ];
    const pts = poly
      .map((pair) => {
        const [px, py] = pair.split(" ").map((v) => parseFloat(v) / 100);
        return `${round(x + px * rw)},${round(y + py * rh)}`;
      })
      .join(" ");

    out.push(
      `<g transform="rotate(${round(rot)} ${round(x + rw / 2)} ${round(y + rh / 2)})">` +
        `<polygon points="${pts}" fill="${fill}" opacity="${round(between(r, 0.88, 1))}"/>` +
        `</g>`,
    );
  }
  return out.join("\n    ");
}

function fold(r: Rng, p: Palette, w: number, h: number) {
  const bands = Math.floor(between(r, 5, 9));
  const step = (h * 1.6) / bands;
  const skew = between(r, 0.3, 0.7);
  const colors = [p.bg, p.mid, p.fg, p.mid];
  const out: string[] = [];

  for (let i = 0; i < bands; i++) {
    const y = -h * 0.3 + step * i;
    out.push(
      `<polygon points="${round(-w * 0.2)},${round(y)} ${round(w * 1.2)},${round(y - w * skew * 0.35)} ${round(w * 1.2)},${round(y - w * skew * 0.35 + step)} ${round(-w * 0.2)},${round(y + step)}"` +
        ` fill="${colors[i % colors.length]}" opacity="${round(between(r, 0.6, 1))}"/>`,
    );
  }
  const ay = between(r, h * 0.3, h * 0.7);
  out.push(
    `<polygon points="${round(-w * 0.2)},${round(ay)} ${round(w * 1.2)},${round(ay - w * skew * 0.35)} ${round(w * 1.2)},${round(ay - w * skew * 0.35 + step * 0.16)} ${round(-w * 0.2)},${round(ay + step * 0.16)}" fill="${p.accent}" opacity="0.75"/>`,
  );
  return out.join("\n    ");
}

/** A plinth with an object on it — the still-life setup we use for objects. */
function still(r: Rng, p: Palette, w: number, h: number) {
  const plinthY = h * between(r, 0.62, 0.72);
  const ow = w * between(r, 0.3, 0.44);
  const oh = h * between(r, 0.22, 0.36);
  const ox = (w - ow) / 2 + between(r, -w * 0.04, w * 0.04);
  const oy = plinthY - oh;
  const shape = pickOne(r, ["rect", "ellipse", "capsule"]);

  const object =
    shape === "ellipse"
      ? `<ellipse cx="${round(ox + ow / 2)}" cy="${round(oy + oh / 2)}" rx="${round(ow / 2)}" ry="${round(oh / 2)}" fill="${p.fg}"/>`
      : shape === "capsule"
        ? `<rect x="${round(ox)}" y="${round(oy)}" width="${round(ow)}" height="${round(oh)}" rx="${round(Math.min(ow, oh) / 2)}" fill="${p.fg}"/>`
        : `<rect x="${round(ox)}" y="${round(oy)}" width="${round(ow)}" height="${round(oh)}" rx="${round(ow * 0.04)}" fill="${p.fg}"/>`;

  return [
    // Table surface, clearly separated from the backdrop
    `<rect x="0" y="${round(plinthY)}" width="${w}" height="${round(h - plinthY)}" fill="${p.mid}"/>`,
    // Cast shadow, thrown to one side
    `<ellipse cx="${round(ox + ow * 0.75)}" cy="${round(plinthY + h * 0.014)}" rx="${round(ow * 0.7)}" ry="${round(h * 0.022)}" fill="${p.bg}" opacity="0.65"/>`,
    object,
    // Shaded side of the object
    `<rect x="${round(ox)}" y="${round(oy)}" width="${round(ow * 0.34)}" height="${round(oh)}" fill="${p.bg}" opacity="0.35"/>`,
    `<line x1="0" y1="${round(plinthY)}" x2="${w}" y2="${round(plinthY)}" stroke="${p.accent}" stroke-width="${round(Math.min(w, h) * 0.003)}" opacity="0.75"/>`,
  ].join("\n    ");
}

const compositions: Record<
  Composition,
  (r: Rng, p: Palette, w: number, h: number) => string
> = { drape, column, arc, collage, fold, still };

// ---------------------------------------------------------------- document

type RenderOptions = {
  tone: Tone;
  composition: Composition;
  width: number;
  height: number;
  seed: string;
  label?: string;
};

function render({
  tone,
  composition,
  width: w,
  height: h,
  seed,
  label,
}: RenderOptions) {
  const r = makeRandom(seed);
  const p = palettes[tone];
  const id = seed.replace(/[^a-z0-9]/gi, "");
  const body = compositions[composition](r, p, w, h);

  const caption = label
    ? `<text x="${round(w * 0.045)}" y="${round(h - h * 0.035)}" font-family="Helvetica, Arial, sans-serif" font-size="${round(Math.min(w, h) * 0.026)}" letter-spacing="${round(Math.min(w, h) * 0.008)}" fill="${p.ink}" opacity="0.45">${label.toUpperCase()}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <defs>
    <linearGradient id="sky${id}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="100%" stop-color="${mix(p.bg, p.mid, 0.32)}"/>
    </linearGradient>
    <radialGradient id="vig${id}" cx="50%" cy="44%" r="82%">
      <stop offset="68%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.2"/>
    </radialGradient>
    <filter id="grain${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n"/>
      <feColorMatrix type="saturate" values="0" in="n" result="g"/>
      <feComponentTransfer in="g" result="grain">
        <feFuncA type="linear" slope="0.5"/>
      </feComponentTransfer>
    </filter>
    <clipPath id="frame${id}">
      <rect x="0" y="0" width="${w}" height="${h}"/>
    </clipPath>
  </defs>

  <g clip-path="url(#frame${id})">
    <rect width="${w}" height="${h}" fill="url(#sky${id})"/>
    ${body}
    <rect width="${w}" height="${h}" fill="url(#vig${id})"/>
    <rect width="${w}" height="${h}" filter="url(#grain${id})" opacity="0.13" style="mix-blend-mode:overlay"/>
    ${caption}
  </g>
</svg>
`;
}

// ---------------------------------------------------------------- write

async function write(relativePath: string, contents: string) {
  const full = join(PUBLIC, relativePath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, contents, "utf8");
}

async function main() {
  let count = 0;

  for (const product of products) {
    for (let i = 0; i < product.images.length; i++) {
      const image = product.images[i];
      await write(
        productImagePath(product.slug, i),
        render({
          tone: image.tone,
          composition: image.composition,
          width: 1200,
          height: 1500,
          seed: `${product.slug}-${i}`,
          label: i === 0 ? product.nameEn : undefined,
        }),
      );
      count++;
    }
  }

  for (const collection of collections) {
    await write(
      collectionImagePath(collection.slug),
      render({
        tone: collection.tone,
        composition: collection.composition,
        width: 1800,
        height: 1100,
        seed: `collection-${collection.slug}`,
        label: collection.nameEn,
      }),
    );
    count++;
  }

  for (const category of categories) {
    await write(
      categoryImagePath(category.slug),
      render({
        tone: category.tone,
        composition: category.composition,
        width: 1000,
        height: 1250,
        seed: `category-${category.slug}`,
        label: category.nameEn,
      }),
    );
    count++;
  }

  // Editorial art used on the home page and About, not tied to a record.
  const editorial: Array<[string, Tone, Composition, number, number]> = [
    ["hero", "ink", "drape", 2200, 1400],
    ["hero-portrait", "ink", "fold", 1200, 1600],
    ["brand-story", "rust", "collage", 1600, 1200],
    ["about-1", "sand", "fold", 1400, 1000],
    ["about-2", "ink", "collage", 1000, 1250],
    ["newsletter", "clay", "arc", 1600, 900],
  ];

  for (const [name, tone, composition, w, h] of editorial) {
    await write(
      `/media/editorial/${name}.svg`,
      render({
        tone,
        composition,
        width: w,
        height: h,
        seed: `editorial-${name}`,
      }),
    );
    count++;
  }

  console.log(`Generated ${count} images into public/media`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
