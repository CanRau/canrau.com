import {
  useLoaderData,
  LinksFunction,
  LoaderFunction,
  useMatches,
  json,
} from "remix";
import { useShouldHydrate } from "remix-utils";
import { useState, useEffect, ReactNode } from "react";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  Link,
  NavLink,
  useNavigate,
  useParams,
} from "remix";
import clsx from "clsx";
import { getDeployVersion } from "~/utils/get-fly-deploy-version";
import { type ThrownResponses } from "~/utils/error-responses";
import tailwindStyles from "~/styles/tailwind.css";
import { UndrawNotFound } from "~/components/illustrations/undraw-not-found";
import { UndrawBugFixing } from "~/components/illustrations/undraw-bug-fixing";
import {
  defaultLang,
  languages,
  rootUrl,
  titleSeperator,
  domain,
} from "/config";
import { repository } from "/package.json";
import type { Lang } from "/types";
import invariant from "tiny-invariant";
import { NewsletterForm } from "~/components/newsletter-form";
// import deleteMeRemixStyles from "~/styles/demos/remix.css";
// import globalStylesUrl from "~/styles/global.css";
// import darkStylesUrl from "~/styles/dark.css";
// import acceptLanguage from "accept-language";
// import { languages } from "/remix.config.js";;

// export let loader: LoaderFunction = ({ request }) => {
// acceptLanguage.languages(languages);
// const defaultLang = languages[0];
// const url = new URL(request.url);
// const browserLang = acceptLanguage.get(
//   request.headers.get("Accept-Language"),
// );

// const lang = browserLang ?? defaultLang;

// if (!url.pathname.startsWith(`/${lang}`)) {
//   url.pathname = `/${lang}${url.pathname}`;
//   return redirect(url.toString());
// }

// return {
//   lang,
// };
// console.log(request.url);
//   return {};
// };

const isProd = process.env.NODE_ENV === "production";

type LoaderData = {
  lang: string;
  commitSha: string;
  appVersion: number;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const lang = params.lang || "en";
  const commitSha = process.env.COMMIT_SHA;
  const DB_ENDPOINT = process.env.DB_ENDPOINT;
  invariant(DB_ENDPOINT, "DB_ENDPOINT MISSING");
  const url = new URL(request.url);
  const { appVersion } = await getDeployVersion();
  // console.log({ appVersion, commitSha });

  return json({ lang, commitSha, appVersion });
};

/**
 * The `links` export is a function that returns an array of objects that map to
 * the attributes for an HTML `<link>` element. These will load `<link>` tags on
 * every route in the app, but individual routes can include their own links
 * that are automatically unloaded when a user navigates away from the route.
 *
 * https://remix.run/api/app#links
 */
export let links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStyles },
    // { rel: "stylesheet", href: globalStylesUrl },
    // {
    //   rel: "stylesheet",
    //   href: darkStylesUrl,
    //   media: "(prefers-color-scheme: dark)",
    // },
    // { rel: "stylesheet", href: deleteMeRemixStyles },
    // { rel: "shortcut icon", type: "image/jpg", href: favicon },
  ];
};

/**
 * The root module's default export is a component that renders the current
 * route via the `<Outlet />` component. Think of this as the global layout
 * component for your app.
 */
export default function App() {
  const { lang, commitSha, appVersion } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash.toLowerCase() === "#roadmap"
    ) {
      navigate(`/${lang}/todos`);
    }
  });

  // todo: add console notes like gaiama.org
  // useEffect(() => {
  // only run in the browser
  //   if (typeof window === "undefined") {
  //     return
  //   }
  //     console.log(
  //       `Welcome to GaiAma.org version 2.10.4, you're on the master branch`,
  //     );
  //     console.log(`Feel free to inspect everything, e.g. 'window.GaiAma'`);
  //     console.log(
  //       `You'll find the MIT licensed source code of the website at https://github.com/gaiama/gaiama.org`,
  //     );
  //     console.log(
  //       `If you encounter anything unexpected, or have other feedback feel free to file an issue at https://github.com/gaiama/gaiama.org/issues/new?labels=ViaDevTools`,
  //     );
  // });

  return (
    <Document lang={lang}>
      <Layout lang={lang} commitSha={commitSha} appVersion={appVersion}>
        <Outlet />
      </Layout>
    </Document>
  );
}

function Document({
  children,
  title,
  lang,
}: {
  children: ReactNode;
  title?: string;
  lang: string;
}) {
  const matches = useMatches();
  const includeScripts = useShouldHydrate();
  // todo: last item in useMatches always correct? get canonical from here as well?
  const { canonical, jsonld } = matches?.[matches.length - 1]?.data ?? {};
  // const match = matches.find((match) => match.handle && match.handle.canonical);
  // const match = matches.find((match) => match.data && match.data.canonical);
  // const canonical = match?.data.canonical;
  // note: use `export const handle = { hydrate: true };` in any route to enable JS

  return (
    <html lang={lang} className="dark scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title ? <title>{title}</title> : null}
        <Meta />
        {!!canonical && <link rel="canonical" href={canonical} />}
        <Links />

        {/* todo: more meta tags */}
        {/* <meta name="theme-color" content="#fff"></meta> */}

        {/* prettier-ignore */}
        <link rel="alternate" type="application/rss+xml" href={`${rootUrl}/${lang}/feed.xml`} title="Can Rau's XML Feed" />
        {/* prettier-ignore */}
        <link rel="alternate" type="application/feed+json" href={`${rootUrl}/${lang}/feed.json`} title="Can Rau's JSON Feed" />
        {/* Google Search Console */}
        {/* prettier-ignore */}
        <meta name="google-site-verification" content="KGv3z097pffnaQ1ZA4nUtkhyewpwfmUPLxAoPVlyfpw" />
        <link rel="sitemap" type="application/xml" href="/en/sitemap.xml" />
        {jsonld && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
          />
        )}
      </head>
      <body className="dark:bg-zinc-900">
        {children}
        <ScrollRestoration />
        {includeScripts && <Scripts />}
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

function Layout({
  lang = "en",
  className = "",
  commitSha,
  appVersion,
  children,
}: {
  lang?: string;
  className?: string;
  commitSha?: string;
  appVersion?: number;
  children: ReactNode;
}) {
  const sha = commitSha ? commitSha.substr(0, 7) : "";
  const matches = useMatches();
  const currentRoute = matches.find((m) => m.data?.totalPathVisits > 0);
  const visits = currentRoute.data.totalPathVisits;
  return (
    <div
      className={clsx(
        "remix-app max-w-prose mx-auto px-10vw md:px-0 dark:text-zinc-100",
        className,
      )}
    >
      <header className="py-9 lg:py-12">
        <div className="lg:max-w-3xl mx-auto md:flex item-center justify-between dark:text-zinc-400">
          <Link to="/" title={domain} className="flex items-center">
            {/* <RemixLogo /> */}
            <h2 className="text-2xl">Can Rau</h2>{" "}
            <span
              title="Work-in-Progress"
              className="ml-2 mt-1 dark:text-gray-500"
            >
              WIP
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="remix-app__header-nav mt-6 md:mt-0"
          >
            <ul className="md:flex">
              <li className="md:px-5 py-2">
                <NavLink to={`/${lang}`}>Home</NavLink>
              </li>
              <li className="md:px-5 py-2">
                <NavLink to={`/${lang}/bookmarks`}>Bookmarks</NavLink>
              </li>
              <li className="md:px-5 py-2">
                <NavLink to={`/${lang}/todos`}>Todos (Roadmap)</NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <div className="remix-app__main">
        <div className="">{children}</div>
      </div>
      <footer className="flex flex-col items-center justify-center mt-24 mb-4 mx-5vw dark:text-zinc-600">
        <NewsletterForm />
        <div className="mt-20">
          <p className="dark:text-gray-400">{visits} visits so far</p>
        </div>
        {/* note: i like not-first:before:content-['_|_'] but those are missing when copying 😒 */}
        <div className="mt-8">
          <span>&copy; 2021 Can Rau</span>
          {" | "}
          <span>
            running on fly.io
            {appVersion && ` as v${appVersion}`}
          </span>
          {commitSha && (
            <>
              {" | "}
              <span>
                <a
                  href={`${repository.url}/commit/${commitSha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  #{sha}
                </a>
              </span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

const catchStrings: Record<Lang, Record<number, string>> = {
  en: {
    401: "Oops! Looks like you tried to visit a page that you do not have access to.",
    404: "Oops! Looks like you tried to visit a page that does not exist.",
  },
  // de: {
  //   401: "",
  //   404: "",
  // },
  // es: {
  //   401: "",
  //   404: "",
  // },
};

export function CatchBoundary() {
  const caught = useCatch<ThrownResponses>();
  const { lang, slug } = useParams<"lang" | "slug">();
  const lng = languages.includes(lang as Lang) ? (lang as Lang) : defaultLang;
  const message = catchStrings?.[lng]?.[caught.status];
  if (!message) {
    throw new Error(caught.data.error || caught.statusText);
  }

  return (
    <Document
      lang={lng}
      title={`${caught.status} ${caught.statusText}${titleSeperator}${domain}`}
    >
      <Layout>
        <h1 className="text-4xl text-center">
          {caught.status} — {caught.statusText}
        </h1>
        <UndrawNotFound className="max-w-xl mx-auto" />
        <p className="text-sm text-right">
          Illustration by{" "}
          <a
            href="https://undraw.co/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Undraw.co
          </a>
        </p>
        <p className="mt-4 text-lg text-center">{message}</p>
      </Layout>
    </Document>
  );
}

const errorStrings: Record<Lang, string> = {
  en: "There was an error",
  // de: "Es gab einen Fehler",
  // es: "Hubo un error",
};

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  const { lang, slug } = useParams<"lang" | "slug">();
  const lng = languages.includes(lang as Lang) ? (lang as Lang) : defaultLang;
  const url = lang ? `/${lang}/${slug}` : "";
  const msg = errorStrings[lng] || errorStrings[defaultLang];
  return (
    <Document lang={lng} title={`Error!${titleSeperator}${domain}`}>
      <Layout>
        <div>
          <h1 className="text-4xl text-center">{msg}</h1>
          <UndrawBugFixing className="max-w-xl mt-8 mx-auto" />
          {/* <p>{error.message}</p>
          <hr />
          <p>
            Hey, developer, you should replace this with what you want your
            users to see.
          </p> */}
        </div>
      </Layout>
    </Document>
  );
}

// function RemixLogo(props: ComponentPropsWithoutRef<"svg">) {
//   return (
//     <svg
//       viewBox="0 0 659 165"
//       version="1.1"
//       xmlns="http://www.w3.org/2000/svg"
//       xmlnsXlink="http://www.w3.org/1999/xlink"
//       aria-labelledby="remix-run-logo-title"
//       role="img"
//       width="106"
//       height="30"
//       fill="currentColor"
//       {...props}
//     >
//       <title id="remix-run-logo-title">Remix Logo</title>
//       <path d="M0 161V136H45.5416C53.1486 136 54.8003 141.638 54.8003 145V161H0Z M133.85 124.16C135.3 142.762 135.3 151.482 135.3 161H92.2283C92.2283 158.927 92.2653 157.03 92.3028 155.107C92.4195 149.128 92.5411 142.894 91.5717 130.304C90.2905 111.872 82.3473 107.776 67.7419 107.776H54.8021H0V74.24H69.7918C88.2407 74.24 97.4651 68.632 97.4651 53.784C97.4651 40.728 88.2407 32.816 69.7918 32.816H0V0H77.4788C119.245 0 140 19.712 140 51.2C140 74.752 125.395 90.112 105.665 92.672C122.32 96 132.057 105.472 133.85 124.16Z" />
//       <path d="M229.43 120.576C225.59 129.536 218.422 133.376 207.158 133.376C194.614 133.376 184.374 126.72 183.35 112.64H263.478V101.12C263.478 70.1437 243.254 44.0317 205.11 44.0317C169.526 44.0317 142.902 69.8877 142.902 105.984C142.902 142.336 169.014 164.352 205.622 164.352C235.83 164.352 256.822 149.76 262.71 123.648L229.43 120.576ZM183.862 92.6717C185.398 81.9197 191.286 73.7277 204.598 73.7277C216.886 73.7277 223.542 82.4317 224.054 92.6717H183.862Z" />
//       <path d="M385.256 66.5597C380.392 53.2477 369.896 44.0317 349.672 44.0317C332.52 44.0317 320.232 51.7117 314.088 64.2557V47.1037H272.616V161.28H314.088V105.216C314.088 88.0638 318.952 76.7997 332.52 76.7997C345.064 76.7997 348.136 84.9917 348.136 100.608V161.28H389.608V105.216C389.608 88.0638 394.216 76.7997 408.04 76.7997C420.584 76.7997 423.4 84.9917 423.4 100.608V161.28H464.872V89.5997C464.872 65.7917 455.656 44.0317 424.168 44.0317C404.968 44.0317 391.4 53.7597 385.256 66.5597Z" />
//       <path d="M478.436 47.104V161.28H519.908V47.104H478.436ZM478.18 36.352H520.164V0H478.18V36.352Z" />
//       <path d="M654.54 47.1035H611.788L592.332 74.2395L573.388 47.1035H527.564L568.78 103.168L523.98 161.28H566.732L589.516 130.304L612.3 161.28H658.124L613.068 101.376L654.54 47.1035Z" />
//     </svg>
//   );
// }
