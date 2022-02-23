import { createCookieSessionStorage, redirect } from "remix";
import { type Params } from "react-router-dom";
import type { Lang } from "/types";
import { domain } from "/config";

const isProd = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export const clientStorage = createCookieSessionStorage({
  cookie: {
    name: "CR_client_id",
    secure: isProd,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    domain: isProd ? domain.toLowerCase() : undefined,
  },
});

export function getUserSession(request: Request) {
  return clientStorage.getSession(request.headers.get("Cookie"));
}

export type User = {
  id: string;
  name: string;
  token: string;
};

export async function requireUser(
  request: Request,
  params: Params<string>,
  // redirectTo: string = new URL(request.url).pathname,
): Promise<User> {
  const lang = (params.lang ?? "en") as Lang;
  const session = await getUserSession(request);
  const id = session.get("id");
  const name = session.get("name");
  const token = session.get("token");
  if (!id || typeof id !== "string") {
    // const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    // throw redirect(`/admin/login?${searchParams}`);
    const reqUrl = new URL(request.url);
    const from = encodeURIComponent(reqUrl.pathname);
    throw redirect(`/${lang}/login?from=${from}`);
  }

  // todo: verify user here everytime? maybe overkill?
  // const res = await fetch(`${process.env.DTKLT_API}/login`, {
  //   method: "POST",
  //   // credentials: "include",
  //   headers: {
  //     "X-CSRF-Token": csrf?.toString() ?? "",
  //     cookie: request.headers.get("cookie") ?? "",
  //   },
  //   body: form,
  // });

  // if (res.status !== 200) {
  //   console.log("Error in login.tsx", await res.text());
  //   return null;
  // }
  // const user: User = await res.json();

  return { id, name, token };
}

type SessionArgs = {
  user: { id: string; name: string; token: string };
  redirectTo: string;
  headers?: HeadersInit;
};

export async function createUserSession({ user, redirectTo, headers }: SessionArgs) {
  const session = await clientStorage.getSession();
  session.set("id", user.id);
  session.set("name", user.name);
  session.set("token", user.token);
  return redirect(redirectTo, {
    headers: {
      ...headers,
      "Set-Cookie": await clientStorage.commitSession(session),
    },
  });
}
