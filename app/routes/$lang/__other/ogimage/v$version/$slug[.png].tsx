import { json, type LoaderFunction } from "remix";
import { Canvas, loadImage, type CanvasRenderingContext2D } from "skia-canvas";
import matter from "gray-matter";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
import { notFoundError } from "~/utils/error-responses";
import { readFile } from "~/utils.server";
import { defaultLang } from "/config";
import { Lang } from "/types";
import { type Frontmatter } from "~/utils/mdx.server";

const sizes: Record<string, number> = {
  small: 504,
  default: 1200,
};

const ratios: Record<string, number> = {
  default: 1.9047619048,
};

const fontDividers: Record<string, number> = {
  default: 16,
};

const marginDividers: Record<string, number> = {
  default: 20,
};

const avatarDividers: Record<string, number> = {
  default: 8,
};

const rand = (n: number) => Math.floor(n * Math.random());

// inspirations
// https://mattdesl.svbtle.com/generative-art-with-nodejs-and-canvas
// spipa circle https://codepen.io/alexandrix/pen/oQOvYp
// https://dev.to/aspittel/intro-to-generative-art-2hi7
// circuit board https://codepen.io/tsuhre/pen/xgmEPe?editors=0010
// https://www.etsy.com/market/circuit_board_art
// https://codepen.io/will627/pen/kyxdKw

// todo: move to https://github.com/Brooooooklyn/canvas ?

export const loader: LoaderFunction = async ({ request, params }) => {
  const { slug, version: ignoredVersion } = params;
  if (!slug) return null;
  const lang = (params.lang ?? defaultLang) as Lang;
  const url = new URL(request.url);
  const querySize = url.searchParams.get("size");
  const ratio = ratios.default as number;
  const fontDivider = fontDividers.default as number;
  const width = (querySize ? sizes[querySize] : sizes.default) as number;
  const height = Math.round(width / ratio);
  const fontSize = Math.floor(width / fontDivider);
  const marginDivider = marginDividers.default as number;
  const avatarDivider = avatarDividers.default as number;
  const margin = Math.floor(width / marginDivider / ratio);
  const avatarSize = Math.floor(width / avatarDivider);
  console.log({ avatarSize, margin });

  const sizeSuffix = width === (sizes.default as number) ? "" : `_${querySize}`;
  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const filePath = getFilePath(contentPath, filename);
  const source = await readFile(filePath, { encoding: "utf-8" }).catch(() => {
    throw notFoundError(lang);
  });

  const {
    data: { status, title, hydrate, description, author, mdx },
  } = matter(source) as unknown as { data: Frontmatter };

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  const CENTER_X = width / 2;

  // todo: make type of BG & colors overidable from frontmatter
  const colors: Array<string> = ["#03430d", "#168e16"];
  draw2ColoredPixelBg({ ctx, width, height, colors });

  // white border
  ctx.fillStyle = "#fff";
  ctx.fillRect(18, 18, width - 36, height - 36);

  // content background
  ctx.fillStyle = "#15201f";
  ctx.fillRect(20, 20, width - 40, height - 40);

  ctx.shadowColor = "#000";
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 7;
  ctx.shadowBlur = 20;

  ctx.font = `bold ${fontSize}pt Menlo`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.textWrap = true;
  const titleMaxWidth = width - 40;
  ctx.fillText(title, CENTER_X, margin, titleMaxWidth);
  const titleHeight = ctx.measureText(title, titleMaxWidth);
  const bottomOfTitle = margin + titleHeight.actualBoundingBoxDescent;

  const img = await loadImage("https://github.com/canrau.png");
  const imageX = CENTER_X - avatarSize / 2;
  const imageY = bottomOfTitle + margin;
  const maskRadius = avatarSize / 2;
  const startAngle = 0;
  const endAngle = 2 * Math.PI;

  // image mask
  // todo: maybe use something similar to my Tailwind egg
  // example: https://stackoverflow.com/questions/66747396/canvas-quadraticcurveto
  ctx.save();
  ctx.beginPath();
  ctx.arc(imageX + avatarSize / 2, imageY + avatarSize / 2, maskRadius, startAngle, endAngle);
  ctx.fill();
  ctx.clip();

  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 13;
  ctx.drawImage(img, imageX, imageY, avatarSize, avatarSize);

  ctx.restore();

  ctx.font = `${Math.floor(width / 34)}pt Menlo`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  const urlY = imageY + avatarSize + margin;
  ctx.shadowColor = "#000";
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.shadowBlur = 5;
  ctx.fillText("canrau.com", CENTER_X, urlY, titleMaxWidth);

  const buffer = await canvas.toBuffer("png", { quality: 1 });

  const headers: HeadersInit = {
    "Content-Type": "image/png",
    // can be `inline` or `attachment`
    "Content-Disposition": `inline; filename="${slug}_ogimage${sizeSuffix}.png"`,
    "x-content-type-options": "nosniff",
  };

  return new Response(buffer, headers);
};

type DrawBgProps = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  colors: Array<string>;
};

function draw2ColoredPixelBg({ ctx, width, height, colors }: DrawBgProps) {
  // ctx.filter = "blur(12px) hue-rotate(20deg)";
  // todo: with or without blur?
  // ctx.filter = "blur(2px)";
  // for (let i = 0; i < 800; i++) {
  //   ctx.fillStyle = `hsl(${rand(140)}deg, 80%, 50%)`;
  //   ctx.beginPath();
  //   ctx.arc(rand(width), rand(height), rand(20) + 5, 0, 2 * Math.PI);
  //   ctx.fill();
  // }

  const gridCellSize = 10;

  // from https://stackoverflow.com/a/32676689/3484824
  for (let y = 0; y < height; y = y + gridCellSize) {
    for (let x = 0; x < width; x = x + gridCellSize) {
      // completely random colors
      // ctx.fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      ctx.fillStyle = colors[rand(colors.length)] as string;
      ctx.fillRect(x, y, gridCellSize, gridCellSize);
    }
  }

  ctx.filter = "none";
}
