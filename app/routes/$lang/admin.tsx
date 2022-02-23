import { type LoaderFunction, NavLink, Outlet, json, useLoaderData, redirect } from "remix";
// import useWebSocket, { ReadyState } from "react-use-websocket";
import { Document } from "~/components/document";
import { useLang } from "~/hooks/use-lang";
import { internalServerError } from "~/utils/error-responses";
import { defaultLang } from "/config";
import { Lang } from "/types";
import { requireUser, type User } from "~/utils/session.server";

type LoaderData = {
  user: User;
  items: any;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const lang = (params.lang ?? defaultLang) as Lang;
  const { DTKLT_API } = process.env;

  if (!DTKLT_API) {
    throw internalServerError(lang, "Missing environment variable `DTKLT_API`");
  }

  const user = await requireUser(request, params);

  const query = new URLSearchParams({
    prefixes: ["##article##"].join(","),
    format: "arr",
  });

  const res = await fetch(`${process.env.DTKLT_API}/get-prefixed?${query}`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  }).catch((e) => {
    if (e.code !== "ECONNREFUSED") {
      console.error(e);
    }
  });

  if (!res || !res.ok) {
    if (res?.status === 401) {
      const reqUrl = new URL(request.url);
      const from = encodeURIComponent(reqUrl.pathname);
      throw redirect(`/${lang}/login?from=${from}`);
    }
    // console.log(res);
    return {};
  }

  const items = await res.json();

  return json({ user, items });
};

export default function AdminLayout() {
  const lang = useLang();
  const { user, items } = useLoaderData<LoaderData>();

  // const { sendJsonMessage, readyState } = useWebSocket(DTKLT_API, {
  //   share: true,
  //   onMessage: (e) => {
  //     console.log({ e });
  //     if (e.data !== "null") {
  //       setItems(JSON.parse(e.data));
  //     }
  //   },
  //   onError: console.error,
  //   queryParams: {
  //     token: user.token,
  //     client_id: user.id,
  //     csrf: csrfToken,
  //   },
  // });

  // useEffect(() => {
  //   sendJsonMessage({
  //     // todo: return actual document objects instead of underlying individual KV pairs 😉
  //     cmd: "GET_MANY_PREFIXED",
  //     data: ["##view##"],
  //   });
  // }, [sendJsonMessage]);

  // useEffect(() => console.log({ items }, "$lang/admin.tsx"), [items]);

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: "Connecting",
  //   [ReadyState.OPEN]: "Open",
  //   [ReadyState.CLOSING]: "Closing",
  //   [ReadyState.CLOSED]: "Closed",
  //   [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  // }[readyState];

  const itemList =
    items
      // ?.filter((i) => i.key.includes("title"))
      ?.map((item: any) => (
        <li key={item.key}>
          <a href={`/${lang}/admin/${item._id}`}>{item["title##S"]}</a>
        </li>
      )) ?? [];

  return (
    <Document lang={lang}>
      <div className="grid grid-cols-12 Xgrid-cols-layout gap-10 dark:text-zinc-100">
        <header className="col-span-full flex space-x-5">
          <div>Menu</div>
          {/* <div>Connection Status: {connectionStatus}</div> */}
        </header>
        <menu className="col-span-2">
          <NavLink to="/">Dashboard</NavLink>
          <ul>{itemList}</ul>
        </menu>
        <div className="col-span-10">
          {/* <Outlet context={{ws}} /> */}
          <Outlet />
        </div>
      </div>
    </Document>
  );
}
