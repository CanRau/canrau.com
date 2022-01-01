import { createCookieSessionStorage, redirect } from "remix";
import { type Params } from "react-router-dom";
import type { Lang } from "/types";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "admin_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function requireUserId(
  request: Request,
  params: Params<string>,
  redirectTo: string = new URL(request.url).pathname,
) {
  const lang = (params.lang || "en") as Lang;
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    // const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    // throw redirect(`/admin/login?${searchParams}`);
    throw redirect(`/${lang}/admin/login`);
  }
  return userId;
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
