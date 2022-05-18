// todo: design article cards with some "adorno" based on the categories og:image bg 🥳
import { json } from "remix";
import { Canvas, loadImage, type CanvasRenderingContext2D } from "skia-canvas";
import sharp from "sharp";
import { Lang } from "/types";
import { readFile, join } from "../utils.server";

export const OG_IMAGE_VERSION = 5;

export type Size = "default" | "small";

type SizeObj = {
  width: number;
  height: number;
  padding: number;
};

const sizes: Record<Size, SizeObj> = {
  small: { width: 504, height: 265, padding: 40 },
  default: { width: 1200, height: 630, padding: 20 },
} as const;

export const defaultOgImageSize = "default";
export const supportedOgImageSizes = Object.keys(sizes);

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

type OgImageGeneratorProps = {
  title: string;
  slug: string;
  lang: Lang;
  status?: string;
  author?: string;
  size: Size;
};

// inspiration distribution in canvas http://jsfiddle.net/mes2L9vf/1/
export const ogImageGenerator = async ({
  title,
  slug,
  lang,
  size,
  status,
  author,
}: OgImageGeneratorProps) => {
  if (!title || !slug) return null;

  const { width, height, padding } = sizes.default;
  const avatarSize = Math.floor(width / 8);

  // todo: probably too much clutter! (consider adding `description`, maybe only if less than n characters)
  // todo: `author` undefined
  // todo: maybe show `status` as well?

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const CENTER_X = width / 2;
  const titleMaxWidth = width - 50; // Math.round((width / 1.0344) * 0.9);
  const pixelsPerRow = height / 3; // for now 3 colums
  const desiredFontSize = Math.floor(width / 14);
  const minFontSize = 50;
  const [ignoredfontSize, fontSizeString] = calcFontSize(
    ctx,
    title,
    titleMaxWidth,
    desiredFontSize,
    minFontSize,
    pixelsPerRow + 90,
  );

  // ctx.save();
  // const maskRadius = width / 48;
  // drawRoundedMask({ ctx, x: 0, y: 0, width, height, radius: maskRadius });
  // ctx.clip();

  // todo: make type of BG & colors overidable from frontmatter
  // const colors: Array<string> = ["#03430d", "#168e16"];
  // draw2ColoredPixelBg({ ctx, width, height, colors });
  const gradient = ctx.createLinearGradient(20, 0, 220, 0);

  // Add three color stops
  gradient.addColorStop(0, "#4942aa");
  // gradient.addColorStop(0.5, "cyan");
  gradient.addColorStop(1, "#5c55d9");

  // Set the fill style and draw a rectangle
  ctx.fillStyle = gradient;
  // ctx.fillStyle = "hsl(243.5, 68.8%, 61%)";
  ctx.fillRect(0, 0, width, height);

  // ctx.restore();

  // content background
  const whiteBorderSize = Math.floor(width / 63);
  // ctx.save();
  // const contentMaskRadius = width / 100;
  // drawRoundedMask({
  //   ctx,
  //   x: whiteBorderSize - 2,
  //   y: whiteBorderSize - 2,
  //   width: width - whiteBorderSize + 1 * 2,
  //   height: height - whiteBorderSize + 1 * 2,
  //   radius: contentMaskRadius,
  // });
  // ctx.clip();

  // white border
  ctx.fillStyle = "#fff";
  ctx.fillRect(
    whiteBorderSize,
    whiteBorderSize,
    width - whiteBorderSize * 2,
    height - whiteBorderSize * 2,
  );

  // ctx.fillStyle = "#15201f";
  ctx.fillStyle = "hsl(240, 2.5%, 15.7%)";
  const contentBackgroundSize = width / 60;
  ctx.fillRect(
    contentBackgroundSize,
    contentBackgroundSize,
    width - contentBackgroundSize * 2,
    height - contentBackgroundSize * 2,
  );
  // ctx.restore();

  if (title.toLowerCase().includes("fly.io")) {
    const flyLogoBuffer = await readFile(
      join(process.cwd(), "app", "assets", "fly.io_brandmark.png"),
    );
    const logo = await loadImage(flyLogoBuffer);
    const logoX = (width / 4.5) * 2;
    const logoY = (height / 3) * 2;
    const logoSize = 250;
    ctx.save();
    ctx.translate(logoSize / 2, logoSize / 2);
    ctx.rotate(convertToRadians(-20));
    ctx.globalAlpha = 0.45;
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }

  ctx.shadowColor = "#000";
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 7;
  ctx.shadowBlur = 20;

  ctx.font = `bold ${fontSizeString} Menlo`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.textWrap = true;
  ctx.fillText(title, CENTER_X, 70, titleMaxWidth);
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

  if (Object.keys(sizes).includes(size) && size !== "default") {
    buffer = await sharp(buffer)
      .resize(sizes[size as Size].width)
      .toBuffer()
      .catch((e) => {
        console.error(e);
        throw json({ lang, error: "Error creating the image" }, 500);
      });
  }

  return buffer;
};

function calcFontSize(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
  desired: number,
  min: number,
  maxHeight: number,
  rounds: number = 0,
): [fontSize: number, fontSizeString: string] {
  const lineHeight = desired > 65 ? 1.2 : desired > 40 ? 1.4 : 1.5;
  if (rounds > 20) return [desired, `${desired}px/${lineHeight}`];

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

function convertToRadians(degree: number) {
  return degree * (Math.PI / 180);
}
