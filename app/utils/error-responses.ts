import type { Lang } from "/types";
import { json, ThrownResponse } from "remix";
import { defaultLang } from "/config";

export type CatchData = {
  lang: Lang;
  error: string;
};

export type ThrownResponses =
  | UnauthorizedResponse
  | ForbiddenResponse
  | NotFoundResponse
  | MethodNotAllowedResponse
  | ImATeapotResponse;

/**
 * Reponse Status Code Helpers
 * status code details via [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
 */

// 401
export type UnauthorizedResponse = ThrownResponse<401, CatchData>;

// Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated".
// That is, the client must authenticate itself to get the requested response.
export const UnauthorizedError = (lang: Lang) =>
  json({ lang, error: "Unauthorized" } as CatchData, 401);

// 403
export type ForbiddenResponse = ThrownResponse<403, CatchData>;

// The client does not have access rights to the content;
// that is, it is unauthorized, so the server is refusing to give the requested resource.
// Unlike 401 Unauthorized, the client's identity is known to the server.
export const ForbiddenError = (lang: Lang) =>
  json({ lang, error: "Unauthorized" } as CatchData, 403);

// 404
export type NotFoundResponse = ThrownResponse<404, CatchData>;

// The server can not find the requested resource.
// In the browser, this means the URL is not recognized.
// In an API, this can also mean that the endpoint is valid but the resource itself does not exist.
// Servers may also send this response instead of 403 Forbidden to hide
// the existence of a resource from an unauthorized client. This response code is probably
// the most well known due to its frequent occurrence on the web.
export const NotFoundError = (lang: Lang = defaultLang) =>
  json({ lang, error: "Not Found" } as CatchData, 404);

// 405
export type MethodNotAllowedResponse = ThrownResponse<405, CatchData>;

// The request method is known by the server but is not supported by the target resource.
// For example, an API may not allow calling DELETE to remove a resource.
export const MethodNotAllowedError = (lang: Lang) =>
  json({ lang, error: "Method Not Allowed" } as CatchData, 405);

// 418
export type ImATeapotResponse = ThrownResponse<418, CatchData>;

// The HTTP 418 I'm a teapot client error response code indicates that the server
// refuses to brew coffee because it is, permanently, a teapot.
// A combined coffee/tea pot that is temporarily out of coffee should instead return 503.
// This error is a reference to Hyper Text Coffee Pot Control Protocol defined in April Fools' jokes in 1998 and 2014.
// Some websites use this response for requests they do not wish to handle, such as automated queries.
export const ImATeaPotError = (lang: Lang) =>
  json({ lang, error: "I'm a teapot" } as CatchData, 418);
