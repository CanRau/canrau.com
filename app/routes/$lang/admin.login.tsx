import {
  type ActionFunction,
  json,
  Form,
  useActionData,
  type LoaderFunction,
  redirect,
  type RouteHandle,
} from "remix";
import clsx from "clsx";
import { createUserSession, requireUserId } from "./admin/session.server";
import type { Lang } from "/types";
import { Document } from "~/components/document";
import { useLang } from "~/hooks/useLang";

export const handle: RouteHandle = {
  hydrate: true,
};

export const action: ActionFunction = async ({ request, params }) => {
  const lang = (params.lang || "en") as Lang;
  const form = await request.formData();
  const password = form.get("password");

  if (password !== process.env.ADMIN_PASS) {
    return json({ error: "Invalid password" }, { status: 400 });
  }

  return createUserSession("1", `/${lang}/admin`);
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const lang = (params.lang || "en") as Lang;
  const userId = await requireUserId(request, params).catch(() => {});
  console.log({ userId });
  if (userId) {
    return redirect(`/${lang}/admin`);
  }

  return null;
};

export default function Admin() {
  const lang = useLang();
  const actionData = useActionData();
  const hasError = actionData?.error;
  return (
    <Document lang={lang}>
      <div className="flex items-center justify-center min-h-screen">
        <Form method="post" className="space-y-3">
          <label className="space-y-1">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={clsx(
                "bg-zinc-300 dark:bg-zinc-700",
                "text-black dark:text-zinc-200",
                "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
                "px-4 py-2 rounded-md border",
                !hasError && "border-transparent",
                hasError && "border-red-800 border-solid",
              )}
            />
            <p className="text-center text-red-500 h-8 py-1">
              {actionData?.error ?? ""}
            </p>
          </label>
          <button
            type="submit"
            className="w-full bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-200 px-4 py-2 rounded-md"
          >
            Login
          </button>
        </Form>
      </div>
    </Document>
  );
}
