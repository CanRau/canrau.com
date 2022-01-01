import {
  useLoaderData,
  json,
  type MetaFunction,
  type LoaderFunction,
} from "remix";
import type { Lang } from "/types";
import { getPostsList, Frontmatter } from "~/utils/mdx.server";
import { NotFoundError } from "~/utils/error-responses";
import { loader as getTotalPathVisitsLoader } from "~/utils/get-total-path-visits";
import {
  defaultLang,
  languages,
  rootUrl,
  titleSeperator,
  domain,
  twitterHandle,
} from "/config";
// import invariant from "tiny-invariant";
// import styles from "~/styles/windicss/index.css";

// export let links: LinksFunction = () => {
//   return [{ rel: "canonical", href: styles }];
// };

type LoaderData = {
  hero: Frontmatter;
  posts: Array<Frontmatter>;
  totalPathVisits: number;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const lang = (params.lang || defaultLang) as Lang;
  if (!languages.includes(lang)) {
    throw NotFoundError();
  }
  // invariant(params.userId, "Expected params.userId");
  const postsPromise = getPostsList({ lang }).catch(() => {
    throw NotFoundError(lang);
  });
  // done: fix visits and `catch` here
  const visitsPromise = getTotalPathVisitsLoader({ request }).catch((error) => {
    console.error(">>>>> ERROR in `$lang/index.tsx` for", request.url);
    console.error({ error });
    console.error("<<<<< ERROR in `$lang/index.tsx`");
  });
  // prettier-ignore
  const [allPosts, totalPathVisits] = await Promise.all([postsPromise, visitsPromise]);

  const hero = allPosts.find((p) => p.slug === "/welcome");
  const posts = allPosts.filter((p) => p.slug !== "/welcome");
  const canonical = `${rootUrl}/${lang}`;
  // todo: once I've got search on this site add a [SearchAction](https://developers.google.com/search/docs/advanced/structured-data/sitelinks-searchbox) to JSON-LD
  // note: Schema.org [WebSite](https://schema.org/WebSite)
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: canonical,
  };
  return json({ hero, posts, canonical, totalPathVisits, jsonld });
};

export const meta: MetaFunction = ({ data }) => {
  const {
    title: _title,
    description: _description,
    lang,
    slug,
    cover,
  } = data?.hero ?? {};
  const title = `${_title || "Missing Title"}${titleSeperator}${domain}`;
  const url = `${rootUrl}/${lang}`;
  const description = _description || "Missing description";
  const image = `${rootUrl}${cover}`;
  return {
    title,
    description,
    "og:url": url,
    "og:title": title,
    "og:description": description,
    "og:image": image,
    "twitter:card": cover ? "summary_large_image" : "summary",
    "twitter:creator": twitterHandle,
    "twitter:site": twitterHandle,
    // "twitter:title": title,
    // "twitter:description": description,
    // "twitter:image": image, // note: validate [Twitter Cards](https://cards-dev.twitter.com/validator/)
    "twitter:alt": title, // note: more about [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started)
  };
};

const Hero = ({ post, url }: { post: Frontmatter; url: string }) => {
  return (
    <a className="" href={url}>
      <div className="dark:text-gray-200">
        <h2 className="text-2xl">{post.title}</h2>
      </div>
      {!!post.cover && (
        <div className="mt-4">
          <img src={post.cover} alt={post.title} />
        </div>
      )}
      <div className="mt-2 dark:text-gray-200">
        <p className="text-xl">{post.description}</p>
      </div>
    </a>
  );
};

const Post = ({ post, url }: { post: Frontmatter; url: string }) => {
  return (
    <a className="space-y-2" href={url}>
      {!!post.cover && <img src={post.cover} alt={post.title} className="" />}
      <h2 className="text-2xl">{post.title}</h2>
      {!!post.description && <p>{post.description}</p>}
    </a>
  );
};

export default function Index() {
  const { hero, posts } = useLoaderData<LoaderData>();

  return (
    <div className="remix__page">
      <Hero post={hero} url={`/${hero.lang}${hero.slug}`} />

      <div className="dark:text-gray-200 mt-10">
        <h2 className="text-4xl">Posts</h2>
      </div>

      <div className="mt-6">
        {/* note: alternative to custom not-first:mt-20 could use space-y-20 */}
        <ul className="list-none space-y-20 dark:text-gray-200">
          {posts.map((post) => {
            const url = `/${post.lang}${post.slug}`;
            // console.log({ post });
            return (
              <li key={url}>
                <Post post={post} url={url} />
              </li>
            );
          })}
        </ul>
      </div>
      {/* <main>
        <h2 className="bg-red-600">Welcome to Remix!</h2>
        <p>We're stoked that you're here. 🥳</p>
        <p className="text-green-300">
          Feel free to take a look around the code to see how Remix does things,
          it might be a bit different than what you’re used to. When you're
          ready to dive deeper, we've got plenty of resources to get you
          up-and-running quickly.
        </p>
        <p>
          Check out all the demos in this starter, and then just delete the{" "}
          <code>app/routes/demos</code> and <code>app/styles/demos</code>{" "}
          folders when you're ready to turn this into your next project.
        </p>
      </main>
      <aside>
        <h2>Demos In This App</h2>
        <ul>
          {data.demos.map((demo) => (
            <li key={demo.to} className="remix__page__resource">
              <Link to={demo.to} prefetch="intent">
                {demo.name}
              </Link>
            </li>
          ))}
        </ul>
        <h2>Resources</h2>
        <ul>
          {data.resources.map((resource) => (
            <li key={resource.url} className="remix__page__resource">
              <a href={resource.url}>{resource.name}</a>
            </li>
          ))}
        </ul>
      </aside> */}
    </div>
  );
}
