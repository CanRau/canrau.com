import { redirect, type ActionFunction, type LoaderFunction } from "remix";

// note: to prevent errors [like this](https://discord.com/channels/770287896669978684/771068344320786452/921025522299981914)
export const action: ActionFunction = async () => {
  return redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 307);
};

// todo: once using express redirect e.g. /accessibility to prefered-language/accessibility or sthg 🤔
export const loader: LoaderFunction = async () => {
  /**
   * sends a 302 by default
   *
   * A 301 redirect is a permanent redirect. It is cacheable and any bookmarks for this URL should be updated to point to the new URL.
   * A 302 redirect is a temporary redirect. It is not cacheable by default and should be re-requested every time (but you can override this with caching headers).
   * A 302 redirect indicates that the redirect is temporary -- clients should check back at the original URL in future requests.
   *
   * more on redirects https://serverfault.com/questions/391181/examples-of-302-vs-303
   */
  return redirect("/en");
};
