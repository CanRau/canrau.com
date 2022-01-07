import { ReactNode, useEffect } from "react";
import {
  Outlet,
  json,
  type LoaderFunction,
  useNavigate,
  useLoaderData,
  NavLink,
  useMatches,
  useCatch,
} from "remix";
import invariant from "tiny-invariant";
import { NewsletterForm } from "~/components/newsletter-form";
import { Link } from "~/components/link";
import { getDeployVersion } from "~/utils/get-fly-deploy-version";
import {
  defaultLang,
  domain,
  titleSeperator,
  twitterHandle,
  twitterId,
} from "/config";
import { repository } from "/package.json";
import { DiGithubBadge } from "react-icons/di";
import { Document } from "~/components/document";
import clsx from "clsx";
import { Lang } from "/types";
import { ThrownResponses } from "~/utils/error-responses";
import { UndrawNotFound } from "~/components/illustrations/undraw-not-found";
import { UndrawBugFixing } from "~/components/illustrations/undraw-bug-fixing";
import { useLang } from "~/hooks/useLang";

type LoaderData = {
  lang: string;
  commitSha: string;
  appVersion: number;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const lang = params.lang || defaultLang;
  const commitSha = process.env.COMMIT_SHA;
  const DB_ENDPOINT = process.env.DB_ENDPOINT;
  invariant(DB_ENDPOINT, "DB_ENDPOINT MISSING");
  const { appVersion } = await getDeployVersion();

  return json({ lang, commitSha, appVersion });
};

function Layout({
  lang = defaultLang,
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
  // const currentRoute = matches.find((m) => m?.data?.totalPathVisits > 0);
  const currentRoute = matches?.[matches.length - 1];
  const { totalPathVisits } = currentRoute?.data ?? {};
  return (
    <div
      className={clsx(
        "remix-app max-w-prose mx-auto px-10vw md:px-0 dark:text-zinc-100",
        className,
      )}
    >
      <div id="accessibility-menu">
        {/* todo: add accessibility help linking to contact once implemented */}
        <a
          id="skip-link"
          href="#content"
          className="sr-only focus:not-sr-only target:not-sr-only"
        >
          Skip to content
        </a>
      </div>
      <header className="py-9 lg:py-12 print:hidden">
        <div className="lg:max-w-3xl mx-auto md:flex item-center justify-between dark:text-zinc-400">
          <Link to={`/${lang}`} title={domain} className="flex items-center">
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
      <div id="content" className="remix-app__main">
        <div className="">{children}</div>
      </div>
      <footer className="flex flex-col items-center justify-center mt-24 mb-4 mx-5vw dark:text-zinc-600 print:hidden space-y-16">
        <NewsletterForm />
        <div>
          Get in touch via{" "}
          <a href={`https://twitter.com/${twitterHandle}`}>{twitterHandle}</a>{" "}
          or{" "}
          <a
            href={`https://twitter.com/messages/compose?recipient_id=${twitterId}`}
          >
            PM
          </a>
        </div>
        <div>
          <p className="dark:text-gray-400">{totalPathVisits} visits so far</p>
        </div>
        {/* note: i like not-first:before:content-['_|_'] but those are missing when copying 😒 */}
        {/* note: alternative could be [react-add-space](https://github.com/AGMETEOR/react-add-space) */}
        <div>
          <span>&copy; 2021 Can Rau</span>
          {/* todo: add follow link?
          note: more about [Twitter Web Intent](https://developer.twitter.com/en/docs/twitter-for-websites/web-intents/overview)
          <a href={`https://twitter.com/intent/follow?screen_name=adam_greenough&original_referer=${encodeURIComponent(canonical)}`}>Follow {twitterHandle}</a>
          */}
          {" | "}
          <span>
            running on fly.io
            {appVersion && ` as v${appVersion}`}
          </span>
          {commitSha && (
            <>
              {" | "}
              <span>
                <a href={`${repository.url}/commit/${commitSha}`}>
                  <DiGithubBadge
                    className="inline"
                    size="1.8rem"
                    title="GitHub Logo"
                  />{" "}
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

export default function LangLayout() {
  const { lang, commitSha, appVersion } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const sha = commitSha ? commitSha.substr(0, 7) : "";
  const matches = useMatches();
  // const currentRoute = matches.find((m) => m?.data?.totalPathVisits > 0);
  const currentRoute = matches?.[matches.length - 1];
  const { totalPathVisits } = currentRoute?.data ?? {};

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
  const lang = useLang();
  const message = catchStrings?.[lang]?.[caught.status];
  if (!message) {
    throw new Error(caught.data.error || caught.statusText);
  }

  return (
    <Document
      lang={lang}
      title={`${caught.status} ${caught.statusText}${titleSeperator}${domain}`}
    >
      <Layout>
        <h1 className="text-4xl text-center">
          {caught.status} — {caught.statusText}
        </h1>
        <UndrawNotFound className="max-w-xl mx-auto" />
        <p className="text-sm text-right">
          Illustration by <a href="https://undraw.co/">Undraw.co</a>
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
  const lang = useLang();
  // const url = lang ? `/${lang}/${slug}` : "";
  const msg = errorStrings[lang] || errorStrings[defaultLang];
  return (
    <Document lang={lang} title={`Error!${titleSeperator}${domain}`}>
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
