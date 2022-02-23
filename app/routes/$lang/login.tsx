import {
  type ActionFunction,
  Form,
  useActionData,
  type LoaderFunction,
  type RouteHandle,
  useLoaderData,
  redirect,
  json,
} from "remix";
import clsx from "clsx";
import { createUserSession, requireUser } from "~/utils/session.server";
import type { Lang } from "/types";
import { Document } from "~/components/document";
import { useLang } from "~/hooks/use-lang";
import { debug } from "~/utils/debug";

export const handle: RouteHandle = {
  hydrate: true,
};

type LoaderData = {
  csrf: string;
  redirectTo: string;
};

type ActionData = {
  errors?: {
    name: string;
    password: string;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const lang = (params.lang ?? "en") as Lang;
  const form = await request.formData();
  const name = form.get("name");
  const password = form.get("password");
  const csrf = form.get("csrf");
  const from = form.get("from");
  form.delete("csrf");
  form.delete("from");

  // if (password !== process.env.ADMIN_PASS) {
  //   return json({ error: "Invalid password" }, { status: 400 });
  // }

  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Please provide your username or e-mail address";
  }

  if (!password) {
    errors.password = "Please provide your password";
  }

  if (Object.values(errors).length > 0) {
    return { errors };
  }

  type User = {
    id: string;
    name: string;
    token: string;
  };

  // const reqHeaders = new Headers();
  // reqHeaders.append("Content-Type", "application/json");
  // reqHeaders.append("X-CSRF-Token", csrf?.toString() ?? "");

  // const req = new Request({
  //   method: "POST",
  //   credentials: "include",
  //   headers: reqHeaders,
  //   body: JSON.stringify(Object.fromEntries(form.entries())),
  // });

  // console.log({ req });

  // const res = await fetch(`${process.env.DTKLT_API}/login`, req);
  // debug();
  const res = await fetch(`${process.env.DTKLT_API}/login`, {
    method: "POST",
    // credentials: "include",
    headers: {
      "X-CSRF-Token": csrf?.toString() ?? "",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: form,
  });

  if (res.status !== 200) {
    console.log("Error in login.tsx", await res.text());
    return null;
  }
  const user: User = await res.json();

  const headers: HeadersInit = {};

  return createUserSession({
    user,
    redirectTo: from?.toString() ?? "",
    ...headers,
  });

  // const cookie = loginReq.headers.get("set-cookie");
  // if (!cookie) return null;

  // // .then((res) => console.log("RESULT", res));
  // return redirect(`/${lang}/admin`, {
  //   headers: {
  //     "Set-Cookie": cookie,
  //   },
  // });
  // return null; //createUserSession("1", `/${lang}/admin`);
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const lang = (params.lang ?? "en") as Lang;
  const user = await requireUser(request, params).catch(() => {});
  if (user?.id) {
    return redirect(`/${lang}/admin`);
  }
  const csrf = await fetch(`${process.env.DTKLT_API}/csrf`);
  const csrfToken = csrf.headers.get("X-CSRF-Token");
  const reqUrl = new URL(request.url);
  const redirectTo = reqUrl.searchParams.get("from") ?? `/${lang}/admin`;

  return json(
    { csrf: csrfToken, redirectTo },
    {
      headers: {
        "Set-Cookie": csrf.headers.get("Set-Cookie") ?? "",
      },
    },
  );
};

export default function Admin() {
  const lang = useLang();
  const { csrf, redirectTo } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  return (
    <Document lang={lang}>
      <div className="flex items-center justify-center min-h-screen">
        <Form method="post" className="space-y-3">
          <label className="space-y-1">
            <div className="dark:text-zinc-100">Username OR E-Mail Address</div>
            <input
              type="text"
              name="name"
              placeholder="MyName OR my@email.com"
              className={clsx(
                "bg-zinc-300 dark:bg-zinc-700",
                "text-black dark:text-zinc-200",
                "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
                "px-4 py-2 rounded-md border",
                !actionData?.errors?.name && "border-transparent",
                actionData?.errors?.name && "border-red-800 border-solid",
              )}
            />
            <p className="text-red-500 h-8 py-1">{actionData?.errors?.name ?? ""}</p>
          </label>
          <label className="space-y-1">
            <div className="dark:text-zinc-100">Password</div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={clsx(
                "bg-zinc-300 dark:bg-zinc-700",
                "text-black dark:text-zinc-200",
                "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
                "px-4 py-2 rounded-md border",
                !actionData?.errors?.password && "border-transparent",
                actionData?.errors?.password && "border-red-800 border-solid",
              )}
            />
            <p className="text-red-500 h-8 py-1">{actionData?.errors?.password ?? ""}</p>
          </label>
          <input type="hidden" name="csrf" value={csrf} />
          <input type="hidden" name="from" value={redirectTo} />
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
