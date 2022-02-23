import type { Lang } from "/types";
import { json, ThrownResponse } from "remix";
import { defaultLang } from "/config";

export type CatchData = {
  lang: Lang;
  msg?: string;
  error: string;
};

export type ThrownResponses =
  | UnauthorizedErrorResponse
  | ForbiddenErrorResponse
  | NotFoundErrorResponse
  | MethodNotAllowedErrorResponse
  | ImATeapotErrorResponse
  | InternalServerErrorResponse;

/**
 * Reponse Status Code Helpers
 * status code details via [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
 */

// 401
export type UnauthorizedErrorResponse = ThrownResponse<401, CatchData>;

// Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated".
// That is, the client must authenticate itself to get the requested response.
export const unauthorizedError = (lang: Lang, msg?: string) =>
  json({ lang, msg, error: "Unauthorized" } as CatchData, 401);

// 403
export type ForbiddenErrorResponse = ThrownResponse<403, CatchData>;

// The client does not have access rights to the content;
// that is, it is unauthorized, so the server is refusing to give the requested resource.
// Unlike 401 Unauthorized, the client's identity is known to the server.
export const forbiddenError = (lang: Lang, msg?: string) =>
  json({ lang, msg, error: "Unauthorized" } as CatchData, 403);

// 404
export type NotFoundErrorResponse = ThrownResponse<404, CatchData>;

// The server can not find the requested resource.
// In the browser, this means the URL is not recognized.
// In an API, this can also mean that the endpoint is valid but the resource itself does not exist.
// Servers may also send this response instead of 403 Forbidden to hide
// the existence of a resource from an unauthorized client. This response code is probably
// the most well known due to its frequent occurrence on the web.
export const notFoundError = (lang: Lang = defaultLang, msg?: string) =>
  json({ lang, msg, error: "Not Found" } as CatchData, 404);

// 405
export type MethodNotAllowedErrorResponse = ThrownResponse<405, CatchData>;

// The request method is known by the server but is not supported by the target resource.
// For example, an API may not allow calling DELETE to remove a resource.
export const methodNotAllowedError = (lang: Lang, msg?: string) =>
  json({ lang, msg, error: "Method Not Allowed" } as CatchData, 405);

// 418
export type ImATeapotErrorResponse = ThrownResponse<418, CatchData>;

// The HTTP 418 I'm a teapot client error response code indicates that the server
// refuses to brew coffee because it is, permanently, a teapot.
// A combined coffee/tea pot that is temporarily out of coffee should instead return 503.
// This error is a reference to Hyper Text Coffee Pot Control Protocol defined in April Fools' jokes in 1998 and 2014.
// Some websites use this response for requests they do not wish to handle, such as automated queries.
export const imATeapotError = (lang: Lang, msg?: string) =>
  json({ lang, msg, error: "I'm a teapot" } as CatchData, 418);

// 500
export type InternalServerErrorResponse = ThrownResponse<500, CatchData>;

// The HTTP 500 I'm a teapot client error response code indicates that the server
// refuses to brew coffee because it is, permanently, a teapot.
// A combined coffee/tea pot that is temporarily out of coffee should instead return 503.
// This error is a reference to Hyper Text Coffee Pot Control Protocol defined in April Fools' jokes in 1998 and 2014.
// Some websites use this response for requests they do not wish to handle, such as automated queries.
export const internalServerError = (lang: Lang, msg?: string) =>
  json({ lang, msg, error: "Internal Server Error" } as CatchData, 500);
