import { FormEvent, useRef, useState } from "react";
import {
  type RouteHandle,
  type LoaderFunction,
  type ActionFunction,
  json,
  useParams,
  Form,
  useActionData,
  useLoaderData,
  redirect,
  unstable_parseMultipartFormData,
} from "remix";

import { useLocation } from "react-router-dom";
import invariant from "tiny-invariant";
import slugify from "@sindresorhus/slugify";
import { type UploadHandler } from "@remix-run/node/formData";
import { type PutObjectCommandInput } from "@aws-sdk/client-s3";
import cuid from "cuid";
import { requireUser, User } from "~/utils/session.server";
import { useFirstRender } from "~/hooks/use-first-render";
import { Lang } from "/types";
import { defaultLang } from "/config";
import { internalServerError } from "~/utils/error-responses";

export const handle: RouteHandle = {
  hydrate: true,
};

type LoaderData = {
  user: User;
  csrf: string;
};

type ActionData = Record<string, string>;

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request, params);
  const lang = (params.lang ?? defaultLang) as Lang;
  const { DTKLT_API } = process.env;

  if (!DTKLT_API) {
    throw internalServerError(lang, "Missing environment variable `DTKLT_API`");
  }

  const csrf = await fetch(`${process.env.DTKLT_API}/csrf`).catch((e) => {
    if (e.code !== "ECONNREFUSED") {
      console.error(e);
    }
  });
  const csrfToken = csrf?.headers.get("X-CSRF-Token");

  return json(
    { user, csrf: csrfToken },
    {
      headers: {
        "Set-Cookie": csrf?.headers.get("Set-Cookie") ?? "",
      },
    },
  );
};

const storageKey = (id: string) => `content_${id}`;

export default function Admin() {
  const { id } = useParams<"id">();
  invariant(id, "Missing $id");
  const { user, csrf } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const location = useLocation();
  const [slug, setSlug] = useState("");
  const isFirstRender = useFirstRender();
  const form = useRef<HTMLFormElement>(null);

  // useEffect(() => {
  //   // localStorage.setItem(storageKey(id), JSON.stringify(state));
  //   // setTimeout(() => {
  //   //   const stored =
  //   //     JSON.parse(localStorage.getItem(storageKey(id)) ?? JSON.stringify(emptyState)) || initialState;
  //   //   dispatch(resetAction(stored));
  //   // }, 10);
  // }, [id, state, initialState]);

  // useEffect(() => {
  //   const newSlug = slugify(state.title);
  //   setSlug(newSlug);
  //   if (!isFirstRender) {
  //     const newUrl = location.pathname.replace(id, newSlug);
  //     window.history.replaceState({}, "", newUrl);
  //   }
  // }, [state.title]);

  const onFormChange = (
    // note: not sure tho 🤔
    e: FormEvent<HTMLFormElement> & { target: HTMLInputElement & { form: HTMLFormElement } },
  ) => {
    if (!form.current) return;
    const data = new FormData(form.current);
    const dataObject = Object.fromEntries(data.entries());
    localStorage.setItem(storageKey(id), JSON.stringify(dataObject));
    const slugInput = form.current.elements.namedItem("slug##S") as HTMLInputElement;
    if (slugInput) slugInput.value = slugify(data.get("title##S")?.toString() ?? "");
  };

  return (
    <>
      <div className="max-w-prose">
        <div>
          <p>{actionData?.error}</p>
        </div>
        <Form method="post" ref={form} onChange={onFormChange} encType="multipart/form-data">
          <fieldset className="space-y-8">
            <div>
              <label>
                <div>Title</div>
                <div>
                  <input
                    name="title##S"
                    type="text"
                    className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                  />
                </div>
              </label>
            </div>

            <div>
              <label>
                <div>Content</div>
                <div>
                  <textarea
                    name="content##S"
                    className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                  />
                </div>
              </label>
            </div>

            <div>
              <label>
                <div>Description</div>
                <div>
                  <input
                    name="description##S"
                    type="text"
                    className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                  />
                </div>
              </label>
            </div>

            <div>
              <label>
                <div>Slug (read-only for now)</div>
                <div>
                  <input
                    name="slug##S"
                    type="text"
                    value={slug}
                    readOnly
                    className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                  />
                </div>
              </label>
            </div>

            <input type="file" name="files" multiple />

            <ul>
              {actionData?.files?.length > 0 &&
                actionData?.files?.map((f) => <li>{f.filename}</li>)}
            </ul>

            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="csrf" value={csrf} />

            <div className="flex justify-between">
              <div className="flex shrink grow-0 mt-auto">
                <button type="reset" className="w-full bg-none dark:text-zinc-500 px-4 py-2 mt-1">
                  Reset
                </button>
              </div>
              <div>
                <label>
                  {/* <div>Status</div> */}
                  <div>
                    <select
                      name="status##S"
                      defaultValue="draft"
                      className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="flex shrink grow-0 mt-auto">
                <button
                  type="submit"
                  className="w-full bg-zinc-300 text-black dark:bg-zinc-700 dark:text-zinc-200 px-4 py-2 mt-1 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </fieldset>
        </Form>
      </div>
      {/* <div className="bg-zinc-600">
        <PlateEditor />
      </div>
      <RteEditor value={value} onChange={onChange} /> */}
    </>
  );
}

const uploadHandler: UploadHandler = async ({ name, filename, mimetype, encoding, stream }) => {
  if (name !== "files") {
    stream.resume();
    return;
  }

  const key = cuid();

  const params: PutObjectCommandInput = {
    Bucket: process.env.S3_BUCKET ?? "", // "assets-canrau-com",
    Key: key,
    Body: stream,
    ContentType: mimetype,
    ContentEncoding: encoding,
    Metadata: {
      filename: filename,
    },
  };

  try {
    const { S3Client, Upload, getApplyMd5BodyChecksumPlugin } = await import("~/utils.server");

    const client = new S3Client({
      endpoint: process.env.S3_ENDPOINT ?? "",
      region: process.env.S3_REGION ?? "",
      // bucketEndpoint: true, might work when setting up cloudflare? oh nevermind as backblaze won't accept dots
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });

    // via https://github.com/aws/aws-sdk-js-v3/issues/2673#issuecomment-991455219
    client.middlewareStack.use(getApplyMd5BodyChecksumPlugin(client.config));

    const upload = new Upload({
      client,
      params,
      // tags: [{ Key: "source", Value: "cms_upload" }], // optional tags
      // queueSize: 4, // optional concurrency configuration
      // partSize: "5MB", // optional size of each part
      // leavePartsOnError: false, // optional manually handle dropped parts
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log({ progress });
    });

    await upload.done();
  } catch (e) {
    console.log(e);
  }

  return JSON.stringify({ filename, key });
};

type UploadFile = {
  key: string;
  filename: string;
};

export const action: ActionFunction = async ({ request, params }) => {
  const lang = (params.lang ?? "en") as Lang;
  const user = await requireUser(request, params);
  const form = await unstable_parseMultipartFormData(request, uploadHandler);
  const fileJsons = form.getAll("files");
  const files = fileJsons.map(
    (str) => JSON.parse((str as unknown as string) ?? "{}") as UploadFile,
  );
  console.log({ files });
  const id = form.get("id");
  const csrf = form.get("csrf");
  if (!id) {
    console.log({ error: "Missing ID" });
    return { error: "Missing ID" };
  }
  if (!csrf) {
    console.log({ error: "Missing CSRF token" });
    return { error: "Missing CSRF token" };
  }
  // const title = form.get("title");
  // const content = form.get("content");
  form.delete("id");
  form.delete("csrf");

  return { files };

  const fields = Object.fromEntries(form.entries());

  const res = await fetch(`${process.env.DTKLT_API}/put`, {
    method: "PUT",
    headers: {
      "X-CSRF-Token": csrf?.toString() ?? "",
      cookie: request.headers.get("cookie") ?? "",
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      id,
      bucket: "article",
      fields: {
        ...fields,
        "lang##S": lang,
        "created##N": Date.now().toString(),
        "author##S": user.id,
      },
    }),
  });

  // const result: Record<string, string> = {};

  if (!res.ok) {
    return { error: "Error saving document 😢" };
  }

  return redirect(`${lang}/admin`);
};
