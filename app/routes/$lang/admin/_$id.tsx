import { ChangeEvent, useEffect, useReducer, useRef, useState } from "react";
import { json, type RouteHandle, type LoaderFunction, useParams, Form } from "remix";

import { useLocation } from "react-router-dom";
import invariant from "tiny-invariant";
import slugify from "@sindresorhus/slugify";
// import { type Descendant } from "slate";
// import { RteEditor } from "~/components/rte/editor";
// import { PlateEditor, PlateLinks } from "~/components/rte/plate";
import { requireUser } from "~/utils/session.server";
import { useFirstRender } from "~/hooks/use-first-render";

export const handle: RouteHandle = {
  hydrate: true,
};

// export const links: LinksFunction = () => {
//   return [...PlateLinks];
// };

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request, params);
  return json({ user });
};

// type Action =
//  | { type: 'request' }
//  | { type: 'success', results: HNResponse }
//  | { type: 'failure', error: string };
type State = {
  id: string;
  title: string;
  content: string;
  description: string;
};

enum ActionKind {
  UpdateId = "UPDATE_ID",
  UpdateTitle = "UPDATE_TITLE",
  UpdateContent = "UPDATE_CONTENT",
  UpdateDescription = "UPDATE_DESCRIPTION",
  Reset = "RESET",
}

type Action =
  | {
      type: ActionKind.UpdateId;
      payload: string;
    }
  | {
      type: ActionKind.UpdateTitle;
      payload: string;
    }
  | {
      type: ActionKind.UpdateContent;
      payload: string;
    }
  | {
      type: ActionKind.UpdateDescription;
      payload: string;
    }
  | {
      type: ActionKind.Reset;
      payload: State;
    };

const updateIdAction = (payload: string): Action => ({
  type: ActionKind.UpdateId,
  payload,
});

const updateTitleAction = (payload: string): Action => ({
  type: ActionKind.UpdateTitle,
  payload,
});

const updateContentAction = (payload: string): Action => ({
  type: ActionKind.UpdateContent,
  payload,
});

const updateDescriptionAction = (payload: string): Action => ({
  type: ActionKind.UpdateDescription,
  payload,
});

const resetAction = (payload: State): Action => ({
  type: ActionKind.Reset,
  payload,
});

const emptyState: State = {
  id: "",
  title: "",
  content: "",
  description: "",
};

const reducer = (state: State, action: Action): State => {
  const { type, payload } = action;
  switch (type) {
    case ActionKind.UpdateId:
      return { ...state, id: payload };
    case ActionKind.UpdateTitle:
      return { ...state, title: payload };
    case ActionKind.UpdateContent:
      return { ...state, content: payload };
    case ActionKind.UpdateDescription:
      return { ...state, description: payload };
    case ActionKind.Reset:
      return payload;
    default:
      return state;
  }
};

const storageKey = (id: string) => `content_${id}`;

const initState = (id: string) => (initial: State) => {
  if (typeof window === "undefined") return initial;
  const stored =
    JSON.parse(localStorage.getItem(storageKey(id)) ?? JSON.stringify(emptyState)) || initial;
  return { ...initial, ...stored };
};

export default function Admin() {
  const { id } = useParams<"id">();
  invariant(id, "Missing $id");
  const location = useLocation();
  const [slug, setSlug] = useState("");
  const isFirstRender = useFirstRender();
  const initialState = emptyState;
  const [state, dispatch] = useReducer(reducer, initialState, initState(id));

  useEffect(() => {
    localStorage.setItem(storageKey(id), JSON.stringify(state));
    // setTimeout(() => {
    //   const stored =
    //     JSON.parse(localStorage.getItem(storageKey(id)) ?? JSON.stringify(emptyState)) || initialState;
    //   dispatch(resetAction(stored));
    // }, 10);
  }, [id, state, initialState]);

  useEffect(() => {
    const newSlug = slugify(state.title);
    setSlug(newSlug);
    if (!isFirstRender) {
      const newUrl = location.pathname.replace(id, newSlug);
      window.history.replaceState({}, "", newUrl);
    }
  }, [state.title]);

  return (
    <>
      <div className="max-w-prose">
        <Form
        // onChange={(e: ChangeEvent<HTMLFormElement>) => console.log(e.target.name)}
        >
          <fieldset className="space-y-8">
            <div>
              <label>
                <div>Title</div>
                <div>
                  <input
                    name="title"
                    type="text"
                    value={state.title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      dispatch(updateTitleAction(e.target.value));
                    }}
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
                    name="content"
                    value={state.content}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                      dispatch(updateContentAction(e.target.value));
                    }}
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
                    name="description"
                    type="text"
                    value={state.description}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      console.log(e.target.value);
                      dispatch(updateDescriptionAction(e.target.value));
                    }}
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
                    name="slug"
                    type="text"
                    value={slug}
                    readOnly
                    className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                  />
                </div>
              </label>
            </div>

            <div className="flex justify-between">
              <div className="flex shrink grow-0 mt-auto">
                <button
                  type="reset"
                  className="w-full bg-none dark:text-zinc-500 px-4 py-2 mt-1"
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(resetAction(initialState));
                  }}
                >
                  Reset
                </button>
              </div>
              <div>
                <label>
                  {/* <div>Status</div> */}
                  <div>
                    <select
                      name="status"
                      className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
                    >
                      <option value="draft" selected>
                        Draft
                      </option>
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
