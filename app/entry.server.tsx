import { renderToString } from "react-dom/server";
import { createCookie, RemixServer, redirect, type EntryContext } from "remix";
import { createGenerator } from "@unocss/core";
import { presetUno } from "@unocss/preset-uno";
import { defaultLang, domain } from "/config";
// import { generateStyles } from "~/generate-styles.server";
// const cachedStyles: Record<string, boolean> = {};
const isProd = process.env.NODE_ENV === "production";

const dontCountCookie = createCookie("CR_dontcount", {
  sameSite: "lax",
  httpOnly: true,
  secure: true,
  // note: session secret generated via `head -c20 /dev/urandom | base64` recommended on [martinfowler.com](https://martinfowler.com/articles/session-secret.html)
  secrets: [process.env.SESSION_SECRET ?? "fG1JZtGFjF5dGCXwEYmdW3RQcvWc6fU"],
  path: "/",
  expires: new Date("2088-01-17"),
});

// todo: [use ETags](https://sergiodxa.com/articles/use-etags-in-remix) when adding cache/caching

const isBadUrl = (url: URL) => {
  return (
    url.pathname.startsWith("/.env") ||
    url.pathname.startsWith("/php") ||
    url.pathname.startsWith("/java_script") ||
    url.pathname.startsWith("/_nuxt") ||
    url.pathname.startsWith("/uploads") ||
    url.pathname.startsWith("/sdk") ||
    url.pathname.startsWith("/evox") ||
    url.pathname.startsWith("/nmap") ||
    url.pathname.startsWith("/boaform") ||
    url.pathname.startsWith("/wp-admin")
  );
};

const redirectLogic = ({
  url,
  request,
  headers,
}: {
  url: URL;
  request: Request;
  headers: Headers;
}) => {
  let shouldRedirect = false;

  // todo: build more extended (db-based) redirect list & solution &| [6G Firewall](https://perishablepress.com/6g/)
  if (isBadUrl(url)) {
    return redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 307);
  }

  // Coding4GaiAma
  if (url.host === "coding4.gaiama.org") {
    url.host = domain.toLowerCase();
    console.log(">>>>>>>>>>>>> Coding4GaiAma", request.url, url.toString());
    shouldRedirect = true;
  }

  // redirect to https:
  if (
    // note: not sure why this worked in Deno? [refed](https://community.fly.io/t/redirect-http-to-https/2714/3?u=canrau) [good article](https://fly.io/blog/always-be-connecting-with-https/)
    // url.protocol === "http:" ||
    request.headers.get("X-Forwarded-Proto") === "http"
  ) {
    url.protocol = "https:";
    shouldRedirect = true;
    // headers["X-Forwarded-Proto"] = "https";
  }

  // prepend www.
  if (!url.host.startsWith("www")) {
    url.host = `www.${url.host}`;
    shouldRedirect = true;
  }

  // strip trailing slash
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/$/, "");
    shouldRedirect = true;
  }

  // old /roadmap from Coding4GaiAma
  if (url.pathname.startsWith(`/${defaultLang}/roadmap`)) {
    url.pathname = `/${defaultLang}/todos`;
    shouldRedirect = true;
  }

  if (isProd && shouldRedirect) {
    return redirect(url.toString(), { headers, status: 301 });
  }
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const url = new URL(request.url);
  // todo: identify url language and use instead of defaultLang

  // write article about how to have different subdomains in Remix

  // use url.hostname and a useMatches handler function (or Context?) to send the current subdomain to routes
  // if page content (frontmatter) defines which subdomain, it can even be excluded from other subdomains
  // or with a canonical duplicate content can be prevented

  const destination = redirectLogic({ url, request, headers: responseHeaders });
  if (destination) {
    return destination;
  }

  // todo: outsource pageview counter logic
  if (url.pathname.includes("dontcount")) {
    url.pathname = `/${defaultLang}`;
    return redirect(url.toString(), {
      headers: {
        // note: need to await in order for the signed cookie to work
        "Set-Cookie": await dontCountCookie.serialize("1"),
      },
    });
  }

  const { matches, routeData } = remixContext;

  const match = matches.find((m) => m.pathname === url.pathname);

  const canonical = match?.route.id && routeData[match.route.id]?.canonical;

  const markup = renderToString(<RemixServer context={remixContext} url={request.url} />);

  // note: first [UnoCSS](https://github.com/unocss/unocss) tests [article](https://antfu.me/posts/reimagine-atomic-css)
  if (url.searchParams.has("unocss")) {
    const generator = createGenerator({ presets: [presetUno()] });

    const { css } = await generator.generate(markup);
    responseHeaders.set("Content-Type", "text/css; charset=UTF-8");
    return new Response(css, { headers: responseHeaders });
  }

  // if (!cachedStyles.preflight) {
  //   console.log("generating preflight styles");
  //   await generatePreflightStyles({ minify: true });
  //   cachedStyles.preflight = true;
  // }
  // if (!cachedStyles[request.url]) {
  // console.log(`generating styles for ${request.url}`);
  // await generateStyles({ url, html: markup, minify: isProd });
  //   cachedStyles[request.url] = true;
  // }

  responseHeaders.set("Content-Type", "text/html");
  if (canonical) {
    responseHeaders.set("Link", `<${canonical}>; rel="canonical"`);
  }

  const response = new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
  // console.log(
  //   "<<<<>>>>CSRF",
  //   ((process.env.CSRF_KEY ?? "") as string).substring(0, 12),
  // );
  // todo: move after response once [figured out how](https://discord.com/channels/770287896669978684/771068344320786452/919301817916088352) — probably once switched to Express template
  const cookieHeader = request.headers.get("Cookie");
  const dontcount = (await dontCountCookie.parse(cookieHeader)) || "";
  if (isProd && !process.env.DB_ENDPOINT) {
    console.error(`>>>>>>>> ERROR MISSING ENV: "DB_ENDPOINT"`);
  } else if (isProd && dontcount !== "1") {
    try {
      const flyRegionHeader = request.headers.get("Fly-Region");
      console.log({ flyRegionHeader });
      const visitRes = await fetch(`${process.env.DB_ENDPOINT}/visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": process.env.CSRF_KEY ?? "",
        },
        body: JSON.stringify({
          status: response.status,
          method: request.method,
          path: url.pathname,
          region: flyRegionHeader, // fixme:
        }),
      });
      if (visitRes.status !== 200) {
        // if (isVerbose) {
        console.log(`Error in page-view counter`, await visitRes.text());
        // }
      }
    } catch (err) {
      // if (isVerbose)
      console.log(`Error catched in page-view counter`, err);
    }
  }

  return response;
}
