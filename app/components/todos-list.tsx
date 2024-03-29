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
import { useLoaderData, type LoaderFunction } from "remix";
import { useMemo } from "react";
import { getMDXComponent } from "mdx-bundler/client";
import type { TodoComment } from "leasot/dist/definitions";
import { bundleMDX } from "~/utils/compile-mdx.server";
import { loader as getTotalPathVisitsLoader } from "~/utils/get-total-path-visits";
import { rootUrl, titleSeperator, domain } from "/config";

type TodoCommentWithMDX = TodoComment & {
  mdx: { code: string };
};

const sortArray = ["FIXME", "TODO", "DONE", "NOTE"];

const getAllFiles = async (
  root: string,
  dirPath: string = "",
  files: Array<string> = [],
) => {
  const _files = await readdir(join(root, dirPath));

  files = files = [];

  for (const file of _files) {
    const filePath = join(root, dirPath, file);
    const filePathRelative = relative(root, filePath);
    if (
      // todo: automate using `.gitignore` file I guess
      filePathRelative.startsWith("node_modules/") ||
      filePathRelative.startsWith(".cache") ||
      filePathRelative.startsWith(".git") ||
      filePathRelative.startsWith(".dockerignore") ||
      filePathRelative.startsWith("public") ||
      filePathRelative.startsWith("build") ||
      filePathRelative.endsWith(".png") ||
      filePathRelative.endsWith(".jpg") ||
      filePathRelative.endsWith(".jpeg") ||
      filePathRelative.endsWith(".ico") ||
      filePathRelative.endsWith(".DS_Store") ||
      filePathRelative.endsWith(".env")
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
};

const leasotExtensionSupported = (ext: string) =>
  leasotExtSupported(ext) || Object.keys(associateParser).includes(ext);

type Todos = Record<string, TodoCommentWithMDX[]>;

export type LoaderData = { canonical: string; todos: Todos };

export const loader: LoaderFunction = async ({ params, request }) => {
  const lang = params.lang || "en";
  const canonical = `${rootUrl}/${lang}/todos`;
  const rootDir = process.cwd();
  const todosUngrouped: TodoComment[] = [];

  const files = await getAllFiles(rootDir);

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

  // console.log(todos);

  return { canonical, todos };
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
      <div id={tag} className="w-172 max-w-90vw px-5" key={tag}>
        <div id={tag.toLowerCase()} className="text-xl">
          {tag}'s ({count} {getEmoji(tag, count)})
        </div>
        <ul className="mt-6">
          {tagsTodos.map((todo) => {
            const Component = useMemo(
              () => getMDXComponent(todo.mdx.code),
              [todo.mdx.code],
            );
            return (
              <li className="mt-4" key={todo.text}>
                <div className="font-boldX">
                  <Component />
                </div>
                <div className="text-xs text-gray-300">
                  {todo.ref ? `Ref: ${todo.ref} - ` : ""}
                  {todo.file}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  });

export const Roadmap = ({ todos }: ITodoProps) => (
  <div className="flex flex-col items-center text-gray-100 my-15">
    {/* <div className="prose"> */}
    <h1 className="text-3xl text-left w-full">Todos</h1>
    <div className="mt-12 space-y-28">
      <TodoList todos={todos} />
    </div>
    {/* </div> */}
  </div>
);

export const TodosList = () => {
  const { todos } = useLoaderData<LoaderData>();
  return (
    <main>
      <Roadmap todos={todos} />
    </main>
  );
};
