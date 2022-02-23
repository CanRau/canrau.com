import { useEffect, type FormEventHandler } from "react";
import {
  Form,
  json,
  type RouteHandle,
  type LoaderFunction,
  useLoaderData,
  ActionFunction,
  useActionData,
  redirect,
} from "remix";
// import useWebSocket from "react-use-websocket";
import cuid from "cuid";
import { requireUser, type User } from "~/utils/session.server";
import { internalServerError } from "~/utils/error-responses";
import { defaultLang } from "/config";
import { Lang } from "/types";
import { AuthenticityTokenInput } from "remix-utils";

export const handle: RouteHandle = {
  hydrate: true,
};

type LoaderData = {
  user: User;
  csrf: string;
};

type ActionData = {
  result: Record<string, string>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const lang = (params.lang ?? defaultLang) as Lang;
  const user = await requireUser(request, params);
  return redirect(`/${lang}/admin/${cuid()}`);
  const { DTKLT_API } = process.env;

  if (!DTKLT_API) {
    throw internalServerError(lang, "Missing environment variable `DTKLT_API`");
  }

  const csrf = await fetch(`${process.env.DTKLT_API}/csrf`);
  const csrfToken = csrf.headers.get("X-CSRF-Token");

  return json(
    { user, csrf: csrfToken },
    {
      headers: {
        "Set-Cookie": csrf.headers.get("Set-Cookie") ?? "",
      },
    },
  );
};

// type AdminContext = {
//   ws: WebSocket
// }

export const action: ActionFunction = async ({ request, params }) => {
  const lang = (params.lang ?? "en") as Lang;
  const user = await requireUser(request, params);
  const form = await request.formData();
  const title = form.get("title");
  const content = form.get("content");
  const csrf = form.get("csrf");
  form.delete("csrf");

  const id = cuid();

  const res = await fetch(`${process.env.DTKLT_API}/put`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrf?.toString() ?? "",
      cookie: request.headers.get("cookie") ?? "",
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      id: `article##${id}`,
      fields: {
        "title##S": title,
        "content##S": content,
        "lang##S": lang,
        "created##N": Date.now().toString(),
        "author##S": user.id,
      },
    }),
  });

  const result: Record<string, string> = {};

  if (!res.ok) {
    result.error = "Error saving document 😢";
  }

  return result;
};

export default function Admin() {
  const { user, csrf } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  console.log("result", actionData?.result);
  // const navigate = useNavigate()
  // const {ws} = useOutletContext<AdminContext>()
  // from https://stackoverflow.com/a/60161181/3484824
  // const ws = useRef<WebSocket>();
  console.log(user.token, user.name);

  // const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.currentTarget);
  //   // for (const [key, value] of formData.entries()) {
  //   //   console.log(key, value)
  //   // }
  //   const formObject = Object.fromEntries(formData.entries());
  //   const id = cuid();
  //   const data = Object.keys(formObject).map((k) => ({
  //     key: `##view##${id}##${k}`,
  //     value: formObject[k],
  //   }));
  //   console.log({ data });
  //   sendJsonMessage({
  //     cmd: "PUT_MANY",
  //     data,
  //   });
  //   // navigate(".")
  // };

  return (
    <div className="dark:text-zinc-100">
      <Form className="space-y-5" method="post">
        <div>
          <label>
            <div>Title</div>
            <div>
              <input
                type="text"
                name="title"
                placeholder="Title"
                className="w-192 bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
              />
            </div>
          </label>
        </div>
        <div>
          <label>
            <div>Content</div>
            <div>
              <textarea
                name="content"
                placeholder="Content"
                rows={15}
                className="w-192 bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
              />
            </div>
          </label>
        </div>

        <AuthenticityTokenInput />
        <input type="hidden" name="csrf" value={csrf} />
        <div>
          <button
            type="submit"
            name="submit"
            className="w-192 mt-2 px-4 py-2 bg-[#6c63ff] text-white font-bold rounded-md"
          >
            Create new
          </button>
        </div>
      </Form>
    </div>
  );
}
