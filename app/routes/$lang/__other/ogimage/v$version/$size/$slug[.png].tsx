import { json, type LoaderFunction } from "remix";
import { Canvas, loadImage, type CanvasRenderingContext2D } from "skia-canvas";
import matter from "gray-matter";
import sharp from "sharp";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
import { notFoundError } from "~/utils/error-responses";
import { readFile } from "~/utils.server";
import { defaultLang } from "/config";
import { Lang } from "/types";
import { type Frontmatter } from "~/utils/mdx.server";

type Size = "default" | "small";

type SizeObj = {
  width: number;
  height: number;
  padding: number;
};

const sizes: Record<Size, SizeObj> = {
  small: { width: 504, height: 265, padding: 40 },
  default: { width: 1200, height: 630, padding: 20 },
} as const;

// const ratios: Record<string, number> = {
//   default: 1.9047619048,
// };

const fontDividers: Record<string, number> = {
  default: 16,
};

// const marginDividers: Record<string, number> = {
//   default: 20,
// };

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

// todo: provide alternatives via Figma API (like flyyer.io) and Canva API
// Figma: https://www.figma.com/developers/api#get-images-endpoint
// Canva: https://docs.developer.canva.com/apps/server-api/post-content-resources-find

function calcFontSize(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
  desired: number,
  min: number,
  maxHeight: number,
  rounds: number = 0,
): [fontSize: number, fontSizeString: string] {
  const lineHeight = desired > 40 ? 1.1 : 1.5;
  if (rounds > 10) return [desired, `${desired}px/${lineHeight}`];

  ctx.font = `bold ${desired}pt Menlo`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.textWrap = true;

  const measures = ctx.measureText(title, maxWidth);

  if (measures.actualBoundingBoxDescent > maxHeight && desired - 1 >= min) {
    return calcFontSize(ctx, title, maxWidth, desired - 1, min, maxHeight, ++rounds);
  } else if (measures.actualBoundingBoxDescent > maxHeight) {
    return calcFontSize(ctx, title, maxWidth - 2, desired, min, maxHeight, ++rounds);
  }

  return [desired, `${desired}px/${lineHeight}`];
}

// inspiration distribution in canvas http://jsfiddle.net/mes2L9vf/1/
export const loader: LoaderFunction = async ({ params }) => {
  // fix: reconsider the version param for proper cache invalidation
  const { slug, size: requestSize, version: ignoredVersion } = params;
  if (!slug) return null;

  const lang = (params.lang ?? defaultLang) as Lang;
  // const ratio = ratios.default as number;
  const fontDivider = fontDividers.default as number;
  const { width, height, padding } =
    typeof requestSize === "undefined" ? sizes.default : sizes[requestSize as Size];
  // const height = Math.round(width / ratio);
  // const marginDivider = marginDividers.default as number;
  const avatarDivider = avatarDividers.default as number;
  // const margin = Math.floor(width / marginDivider / ratio);
  // const marginY = Math.floor(width / marginDivider / ratio);
  // const marginX = Math.floor(width / marginDivider / ratio);
  // console.log({ margin });
  const avatarSize = Math.floor(width / avatarDivider);

  const sizeSuffix = width === sizes.default.width ? "" : `_${requestSize}`;
  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const filePath = getFilePath(contentPath, filename);
  const source = await readFile(filePath, { encoding: "utf-8" }).catch(() => {
    throw notFoundError(lang);
  });

  // todo: probably too much clutter! (consider adding `description`, maybe only if less than n characters)
  // todo: `author` undefined
  // todo: maybe show `status` as well?
  const {
    data: { status, title, description, author },
  } = matter(source) as unknown as { data: Frontmatter };

  console.log({ author, status, description });

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const CENTER_X = width / 2;
  const titleMaxWidth = width - 150; // Math.round((width / 1.0344) * 0.9);
  const pixelsPerRow = height / 3; // for now 3 colums
  const desiredFontSize = Math.floor(width / fontDivider);
  const [ignoredfontSize, fontSizeString] = calcFontSize(
    ctx,
    title,
    titleMaxWidth,
    desiredFontSize,
    20,
    pixelsPerRow,
  );
  console.log({ ignoredfontSize, fontSizeString });
  // const titleMeasures = ctx.measureText(title, titleMaxWidth);

  ctx.save();
  const maskRadius = width / 48;
  drawRoundedMask({ ctx, x: 0, y: 0, width, height, radius: maskRadius });
  ctx.clip();

  // todo: make type of BG & colors overidable from frontmatter
  const colors: Array<string> = ["#03430d", "#168e16"];
  draw2ColoredPixelBg({ ctx, width, height, colors });

  ctx.restore();

  // white border
  ctx.fillStyle = "#fff";
  const whiteBorderSize = Math.floor(width / 66);
  ctx.fillRect(
    whiteBorderSize,
    whiteBorderSize,
    width - whiteBorderSize * 2,
    height - whiteBorderSize * 2,
  );

  // content background
  ctx.fillStyle = "#15201f";
  const contentBackgroundSize = width / 60;
  ctx.fillRect(
    contentBackgroundSize,
    contentBackgroundSize,
    width - contentBackgroundSize * 2,
    height - contentBackgroundSize * 2,
  );

  ctx.shadowColor = "#000";
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 7;
  ctx.shadowBlur = 20;

  ctx.font = `bold ${fontSizeString} Menlo`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.textWrap = true;
  ctx.fillText(title, CENTER_X, 90, titleMaxWidth);
  // const bottomOfTitle = paddin + titleMeasures.actualBoundingBoxDescent;

  const img = await loadImage("https://github.com/canrau.png");
  const imageX = CENTER_X - avatarSize / 2;
  const imageY = pixelsPerRow + pixelsPerRow / 2 + padding; //bottomOfTitle + paddin;
  const avatarRadius = avatarSize / 2;
  const startAngle = 0;
  const endAngle = 2 * Math.PI;

  // image mask
  // todo: maybe use something similar to my Tailwind egg
  // example: https://stackoverflow.com/questions/66747396/canvas-quadraticcurveto
  ctx.save();
  ctx.beginPath();
  ctx.arc(imageX + avatarSize / 2, imageY + avatarSize / 2, avatarRadius, startAngle, endAngle);
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
  const urlY = imageY + avatarSize + padding;
  ctx.shadowColor = "#000";
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.shadowBlur = 5;
  ctx.fillText("canrau.com", CENTER_X, urlY, titleMaxWidth);

  let buffer = await canvas.toBuffer("png", { quality: 1 });

  const headers: HeadersInit = {
    "Content-Type": "image/png",
    // can be `inline` or `attachment`
    "Content-Disposition": `inline; filename="${slug}_ogimage${sizeSuffix}.png"`,
    "x-content-type-options": "nosniff",
  };

  if (Object.keys(sizes).includes(requestSize ?? "") && requestSize !== "default") {
    buffer = await sharp(buffer)
      .resize(sizes[requestSize as Size])
      .toBuffer()
      .catch((e) => {
        console.error(e);
        throw json({ lang, error: "Error creating the image" }, 500);
      });
  }

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
type DrawRoundedMaskProps = {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

// from: https://stackoverflow.com/a/66773766/3484824
function drawRoundedMask({ ctx, x, y, width, height, radius }: DrawRoundedMaskProps) {
  const c = 0.55191502449;
  const cP = radius * (1 - c);
  const right = x + width;
  const bottom = y + height;
  ctx.beginPath();
  ctx.lineTo(right - radius, y);
  ctx.bezierCurveTo(right - cP, y, right, y + cP, right, y + radius);
  ctx.lineTo(right, bottom - radius);
  ctx.bezierCurveTo(right, bottom - cP, right - cP, bottom, right - radius, bottom);
  ctx.lineTo(x + radius, bottom);
  ctx.bezierCurveTo(x + cP, bottom, x, bottom - cP, x, bottom - radius);
  ctx.lineTo(x, y + radius);
  ctx.bezierCurveTo(x, y + cP, x + cP, y, x + radius, y);
  ctx.closePath();
}
