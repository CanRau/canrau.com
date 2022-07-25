import {
  type LinksFunction,
  Outlet,
  type LoaderFunction,
  useLoaderData,
  json,
  useCatch,
  Meta,
  Links,
} from "remix";
import { AuthenticityTokenProvider, createAuthenticityToken } from "remix-utils";
import tailwindStyles from "~/styles/tailwind.css";
import { clientStorage } from "~/utils/session.server";
import { useLang } from "./hooks/use-lang";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStyles },
    // {
    //   rel: "stylesheet",
    //   href: darkStylesUrl,
    //   media: "(prefers-color-scheme: dark)",
    // },
    // { rel: "shortcut icon", type: "image/jpg", href: favicon },
  ];
};

interface LoaderData {
  csrf: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  // fixme: is this needed here??
  // note: needs `app/utils/session.server.ts`
  const session = await clientStorage.getSession(request.headers.get("cookie"));
  const token = createAuthenticityToken(session);
  return json<LoaderData>(
    { csrf: token },
    { headers: { "Set-Cookie": await clientStorage.commitSession(session) } },
  );
};

export default function App() {
  const { csrf } = useLoaderData<LoaderData>();
  return (
    <AuthenticityTokenProvider token={csrf}>
      <Outlet />
    </AuthenticityTokenProvider>
  );
}

// todo: root [CatchBoundary](https://remix.run/docs/en/v1/guides/not-found) & [errors](https://remix.run/docs/en/v1/guides/errors)
export function CatchBoundary() {
  const caught = useCatch();
  const lang = useLang();
  return (
    <html lang={lang}>
      <head>
        <title>Oops!</title>
        <Meta />
        <Links />
      </head>
      <body className="prose">
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }) {
  const lang = useLang();
  console.error(error);
  return (
    <html lang={lang}>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body className="prose">
        <h1>
          <span role="img" aria-label="emoji face with wide open eyes">
            😳
          </span>{" "}
          Oh no!
        </h1>
        <h2>That looks like a more serious error than expected</h2>
      </body>
    </html>
  );
}
