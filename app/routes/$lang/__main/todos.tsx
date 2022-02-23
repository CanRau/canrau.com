// todo: Twitter profile banner like [Prateek Surana](https://twitter.com/psuranas) using [API](https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_banner)
// todo: when adding cache/caching check out [Loader vs Route Cache Headers in Remix](https://sergiodxa.com/articles/loader-vs-route-cache-headers-in-remix)
// note: [GaiAma Paypal plaintext link](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TU5GAQZHYT8NC)

// todo: add [review](https://simonknott.de/articles/review-snippet) feature 🥰

// fixme: add impressum [1](https://simonknott.de/impressum.html) & datenschutz [1](https://simonknott.de/datenschutz.html)

// todo: broken link checker?
// https://www.npmjs.com/package/broken-link-checker
// https://www.npmjs.com/package/hyperlink

import { useLoaderData, type LoaderFunction, type MetaFunction } from "remix";
import { useMemo } from "react";
import { getMDXComponent } from "mdx-bundler/client";
import type { TodoComment } from "leasot/dist/definitions";
import { DiGithubBadge } from "react-icons/di";
import {
  readdir,
  readFile,
  stat,
  extname,
  basename,
  join,
  relative,
  leasot,
  leasotExtSupported,
} from "~/utils.server";
import { Link } from "~/components/link";
import { bundleMDX } from "~/utils/compile-mdx.server";
import { loader as getTotalPathVisitsLoader } from "~/utils/get-total-path-visits";
import { rootUrl, titleSeperator, domain } from "/config";
import { repository } from "/package.json";
import { Lang } from "/types";

const sortArray = ["FIXME", "TODO", "DONE", "NOTE"];

export const meta: MetaFunction = () => ({
  title: `Todos${titleSeperator}${domain}`,
  description: "Follow my actual in-code TODO & FIXME comments",
});

type TodoCommentWithMDX = TodoComment & {
  mdx: { code: string };
};

const getAllFiles = async (
  root: string,
  dirPath: string = "",
  files: Array<string> = [],
) => {
  const _files = await readdir(join(root, dirPath));

  files = files = [];

  for (const file of _files) {
    const filePath = join(root, dirPath, file);
    // exec
    const filePathRelative = relative(root, filePath);
    if (
      // todo: automate using `.gitignore` file I guess
      filePathRelative.startsWith("node_modules/") ||
      filePathRelative.startsWith(".cache") ||
      filePathRelative.startsWith(".git") ||
      filePathRelative.startsWith("yarn") ||
      filePathRelative.startsWith(".yarn") ||
      filePathRelative.startsWith(".dockerignore") ||
      filePathRelative.startsWith("public") ||
      filePathRelative.startsWith("build") ||
      filePathRelative.endsWith(".png") ||
      filePathRelative.endsWith(".jpg") ||
      filePathRelative.endsWith(".jpeg") ||
      filePathRelative.endsWith(".mp3") ||
      filePathRelative.endsWith(".mp4") ||
      filePathRelative.endsWith(".wav") ||
      filePathRelative.endsWith(".mpeg") ||
      filePathRelative.endsWith(".mpg") ||
      filePathRelative.endsWith(".ico") ||
      filePathRelative.endsWith(".DS_Store") ||
      filePathRelative.endsWith(".env") ||
      filePathRelative.endsWith(".mod") ||
      filePathRelative.endsWith(".sum") ||
      filePathRelative.endsWith("servedb") ||
      filePathRelative.endsWith(".eslintignore") ||
      filePathRelative.endsWith(".eslintrc") ||
      filePathRelative.endsWith(".npmrc") ||
      filePathRelative.endsWith(".gitignore") ||
      filePathRelative.endsWith(".dockerignore") ||
      filePathRelative.endsWith("LICENSE") ||
      filePathRelative.endsWith(".zip")
    ) {
      continue;
    }
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      files.push(...(await getAllFiles(root, join(dirPath, file), files)));
    } else {
      // fileStat.
      // todo: maybe use [mmmagic](https://github.com/mscdex/mmmagic) to get mime type to exclude images, videos etc
      files.push(join(root, dirPath, file));
    }
  }

  return files;
};

// not working by https://stackoverflow.com/a/64489535/3484824
// const groupBy = <T>(array: T[], predicate: (v: T) => string) => array.reduce((acc, value) => {
//     (acc[predicate(value)] ||= []).push(value);
//     return acc;
//   }, {} as { [key: string]: T[] });

// by https://stackoverflow.com/a/66987261/3484824
const groupBy = <T, K extends keyof T>(
  array: T[],
  groupOn: K | ((i: T) => string),
): Record<string, T[]> => {
  const groupFn =
    typeof groupOn === "function" ? groupOn : (o: T) => o[groupOn];

  return Object.fromEntries(
    array.reduce((acc, obj) => {
      const groupKey = groupFn(obj);
      return acc.set(groupKey, [...(acc.get(groupKey) || []), obj]);
    }, new Map()),
  ) as Record<string, T[]>;
};

const associateParser = {
  ".mdx": { parserName: "defaultParser" },
  ".json": { parserName: "defaultParser" },
  ".toml": { parserName: "defaultParser" },
  ".Dockerfile": { parserName: "defaultParser" },
  ".svg": { parserName: "defaultParser" },
};

const leasotExtensionSupported = (ext: string) =>
  leasotExtSupported(ext) || Object.keys(associateParser).includes(ext);

type Todos = Record<string, TodoCommentWithMDX[]>;
type LoaderData = { canonical: string; todos: Todos; totalPathVisits: number };

const cached: Record<Lang, any> = { en: null };

export const loader: LoaderFunction = async ({ params, request }) => {
  const start = performance.now();
  const lang = (params.lang || "en") as Lang;

  if (cached[lang]) {
    const stop = performance.now();
    console.log(`todos.tsx time: ${Number((stop - start) / 1000).toFixed(3)}s`);
    return cached[lang];
  }

  const canonical = `${rootUrl}/${lang}/todos`;
  const rootDir = process.cwd();
  const todosUngrouped: TodoComment[] = [];

  const [files, totalPathVisits] = await Promise.all([
    getAllFiles(rootDir),
    getTotalPathVisitsLoader({ request }),
  ]);

  for (const filePath of files) {
    const fileContent = await readFile(filePath, { encoding: "utf-8" });
    const filename = basename(filePath);
    let extension = extname(filename);
    // note: to hack around [leasot not allowing extensionless files](https://github.com/pgilad/leasot/blob/3e6e07a507d180d1d7c2c6265dd7728ce370a40b/src/lib/parsers.ts#L88)
    if (extension === "") {
      extension = filename.startsWith(".") ? filename : `.${filename}`;
    }
    if (!leasotExtensionSupported(extension)) {
      console.error(
        `>>>>>>>> LEASOT: Unsupported extension: "${extension}" (${filePath})`,
      );
      continue;
    }
    const fileTodos = leasot.parse(fileContent, {
      extension,
      filename: relative(rootDir, filePath),
      customTags: ["note", "done", "fix"],
      associateParser,
    });
    todosUngrouped.push(...fileTodos);
  }
  const todosWithMDX: TodoCommentWithMDX[] = await Promise.all(
    todosUngrouped.map(async (t) => ({
      ...t,
      // mdx: await processMarkdown.process(t.text),
      mdx: await bundleMDX({ source: t.text }),
    })),
  );

  const todos = groupBy(todosWithMDX, "tag");

  const loaderOutput = { canonical, todos, totalPathVisits };
  cached[lang] = loaderOutput;

  const stop = performance.now();
  console.log(`todos.tsx time: ${Number((stop - start) / 1000).toFixed(3)}s`);

  return loaderOutput;
};

const getEmoji = (tag: string, num: number) => {
  if (tag === "DONE") {
    return <span>{num > 20 ? `🥰` : num > 10 ? `😎` : `😌`}</span>;
  }
  return <span>{num > 20 ? `😱` : num > 10 ? `😨` : `😊`}</span>;
};

type ITodoProps = {
  todos: Todos;
};

const TodoList = ({ todos }: ITodoProps) =>
  sortArray.map((tag) => {
    const tagsTodos = todos?.[tag];
    if (!tagsTodos || tagsTodos.length === 0) return null;
    const count = tagsTodos.length;
    return (
      <div id={tag} className="w-172 max-w-90vw px-5 space-y-6" key={tag}>
        <div id={tag.toLowerCase()} className="text-2xl">
          {tag}'s ({count} {getEmoji(tag, count)})
        </div>
        <ul className="space-y-5">
          {tagsTodos.map((todo) => {
            const Component = useMemo(
              () => getMDXComponent(todo.mdx.code),
              [todo.mdx.code],
            );
            return (
              <li key={todo.text}>
                <div className="prose dark:prose-invert">
                  <Component components={{ a: Link, Link }} />
                </div>
                <div className="text-xs dark:text-zinc-500">
                  {todo.ref ? `Ref: ${todo.ref} - ` : ""}
                  <a
                    href={`${repository.url}/blob/main/${todo.file}#L${todo.line}`}
                  >
                    <DiGithubBadge
                      className="inline"
                      size="1.1rem"
                      title="GitHub Logo"
                    />{" "}
                    {todo.file}#L{todo.line}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  });

// todo: use [match-sorter](https://github.com/kentcdodds/match-sorter) for todo filtering
export const Roadmap = ({ todos }: ITodoProps) => (
  <div className="flex flex-col items-center dark:text-zinc-100 space-y-10">
    {/* <div className="prose"> */}
    <h1 className="text-3xl text-left w-full">Todos</h1>
    <div className="space-y-28 text-lg">
      <TodoList todos={todos} />
    </div>
    {/* </div> */}
  </div>
);

export default function Todos() {
  const { todos } = useLoaderData<LoaderData>();
  return (
    <main>
      <Roadmap todos={todos} />
    </main>
  );
}
