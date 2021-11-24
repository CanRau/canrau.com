import { renderToString } from "react-dom/server";
import { RemixServer } from "remix";
import type { EntryContext } from "remix";
import {
  generateStyles,
  generatePreflightStyles,
} from "~/generate-styles.server";

const cachedStyles: Record<string, boolean> = {};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />,
  );

  if (!cachedStyles.preflight) {
    console.log("generating preflight styles");
    await generatePreflightStyles({ minify: true });
    cachedStyles.preflight = true;
  }
  if (!cachedStyles[request.url]) {
    console.log(`generating styles for ${request.url}`);
    const url = new URL(request.url);
    await generateStyles({ url, html: markup, minify: true });
    cachedStyles[request.url] = true;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
