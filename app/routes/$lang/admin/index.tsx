// import { useEffect, useRef } from "react";
import {
  // useOutletContext,
  json,
  type RouteHandle,
  type LoaderFunction,
  useLoaderData,
} from "remix";
// import useWebSocket, { ReadyState } from "react-use-websocket";
import { requireUser, type User } from "~/utils/session.server";
import { internalServerError } from "~/utils/error-responses";
import { defaultLang } from "/config";
import { Lang } from "/types";
// import { CookieDecoder } from "~/utils/cookie-decoder.server";

export const handle: RouteHandle = {
  hydrate: true,
};

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

  // const res = await fetch(`${process.env.DTKLT_API}/get`, {
  //   headers: {
  //     Authorization: `Bearer ${user.token}`,
  //   },
  // });

  // if (!res.ok) {
  //   console.log(res);
  //   throw new Error("ERROR");
  // }

  // const items = await res.json();

  return json({ user });
};

// type AdminContext = {
//   ws: WebSocket
// }

export default function Admin() {
  const { user, DTKLT_API } = useLoaderData<LoaderData>();
  // const {ws} = useOutletContext<AdminContext>()
  // from https://stackoverflow.com/a/60161181/3484824
  // const ws = useRef<WebSocket>();

  // useEffect(() => {
  //   ws.current = new WebSocket(
  //     "ws://localhost:8080?token=59189c85208af5aae05a6552205167",
  //   );
  //   ws.current.onopen = () => console.log('ws opened');
  //   ws.current.onclose = () => console.log('ws closed');

  //   const wsCurrent = ws.current;
  //   return () => {
  //     wsCurrent.close();
  //   }
  // })

  // useEffect(() => {
  //   if (!ws.current) return;

  //   ws.current.onmessage = (m) => {
  //     console.log(m.data);
  //   };

  //   ws.current.send(
  //     // JSON.stringify({
  //     //   cmd: "PUT_MANY",
  //     //   data: [
  //     //     {
  //     //       key: "##url##canrau.com/en##url",
  //     //       value: "https://www.canrau.com/en",
  //     //     },
  //     //     { key: "##url##canrau.com/en##title", value: "CanRau.com" },
  //     //     {
  //     //       key: "##url##canrau.com/en/welcome##url",
  //     //       value: "https://www.canrau.com/en/welcome",
  //     //     },
  //     //     {
  //     //       key: "##url##canrau.com/en/welcome##title",
  //     //       value: "Welcome - CanRau.com",
  //     //     },
  //     //     {
  //     //       key: "##url##github.com/canrau##url",
  //     //       value: "https://github.com/CanRau",
  //     //     },
  //     //   ],
  //     // }),
  //     JSON.stringify({
  //       cmd: "GET_MANY_PREFIXED",
  //       data: ["##url##g", "##block##ckymi6rwq0001fo12t6jiknil"],
  //     }),
  //     // JSON.stringify({
  //     //   cmd: "GET_MANY",
  //     //   data: ["##block##ckymi6rwq0001fo12t6jiknil"],
  //     // }),
  //     // JSON.stringify({
  //     //   cmd: "GET_MANY",
  //     //   data: [
  //     //     "##block##ckymi6rwq0001fo12t6jiknil",
  //     //     "##block##ckymi6wrh0001fo12qejqpowd",
  //     //     "##block##ckymi4yly0001fo12icfdmljw",
  //     //   ],
  //     // }),
  //   );
  // }, [])
  // const { sendJsonMessage, lastJsonMessage } = useWebSocket(DTKLT_API, {
  //   share: true,
  //   // onMessage: console.log, // todo: or use those instead of lastJsonMessage?
  //   // onError: console.error,
  //   queryParams: {
  //     token: user.token,
  //     client_id: user.id,
  //   },
  // });

  // useEffect(() => {
  //   console.log(lastJsonMessage?.data);
  // }, [lastJsonMessage]);

  return (
    <div>
      <button
        onClick={() => {
          // e.preventDefault();
          // sendJsonMessage({
          //   cmd: "PUT_MANY",
          //   data: [
          //     {
          //       key: "##url##canrau.com/en##url",
          //       value: "https://www.canrau.com/en",
          //     },
          //     { key: "##url##canrau.com/en##title", value: "CanRau.com" },
          //     {
          //       key: "##url##canrau.com/en/welcome##url",
          //       value: "https://www.canrau.com/en/welcome",
          //     },
          //     {
          //       key: "##url##canrau.com/en/welcome##title",
          //       value: "Welcome - CanRau.com",
          //     },
          //     {
          //       key: "##url##github.com/canrau##url",
          //       value: "https://github.com/CanRau",
          //     },
          //   ],
          // })
          // sendJsonMessage({
          //   cmd: "GET_MANY_PREFIXED",
          //   data: ["##url##g", "##block##ckymi6rwq0001fo12t6jiknil"],
          // });
        }}
      >
        fetch
      </button>
    </div>
  );
}
