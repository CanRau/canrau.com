// todo: add [slate-edit-list](https://github.com/productboard/slate-edit-list)
// [remark-slate](https://github.com/hanford/remark-slate)
import { useCallback, useMemo, ReactNode, DetailedHTMLProps } from "react";
import {
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
  Range,
  type BaseEditor,
  type Descendant,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  useSlate,
  useSlateStatic,
  useSelected,
  useFocused,
  ReactEditor,
} from "slate-react";
import { type HistoryEditor, withHistory } from "slate-history";
import { isKeyHotkey } from "is-hotkey";
import clsx from "clsx";
import { MouseEventHandler } from "react";
import { imageExtensions } from "./image-extensions";

const HOTKEYS: Record<string, string> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  // "mod+`": "code",
};

const SHORTCUTS: Record<string, string> = {
  "*": "list-item",
  "-": "list-item",
  "+": "list-item",
  ">": "block-quote",
  "#": "heading-one",
  "##": "heading-two",
  "###": "heading-three",
  "####": "heading-four",
  "#####": "heading-five",
  "######": "heading-six",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

export type ParagraphElement = {
  type: "paragraph";
  children: CustomText[];
};

export type HeadingElement = {
  type: "heading";
  level: number;
  children: CustomText[];
};

export type CustomElement = ParagraphElement | HeadingElement;

export type FormattedText = { text: string; bold?: true };

export type CustomText = FormattedText;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

export type IEditor = {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
};

export const RteEditor = ({ value, onChange }: IEditor) => {
  const editor = useMemo(
    () =>
      withShortcuts(
        withInlines(withImages(withReact(withHistory(createEditor())))),
      ),
    [],
  );
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  // from https://github.com/ianstormtaylor/slate/blob/main/site/examples/inlines.tsx
  const inlinesOnKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const { selection } = editor;

    // Default left/right behavior is unit:'character'.
    // This fails to distinguish between two cursor positions, such as
    // <inline>foo<cursor/></inline> vs <inline>foo</inline><cursor/>.
    // Here we modify the behavior to unit:'offset'.
    // This lets the user step into and out of the inline without stepping over characters.
    // You may wish to customize this further to only use unit:'offset' in specific cases.
    if (selection && Range.isCollapsed(selection)) {
      const { nativeEvent } = event;
      if (isKeyHotkey("left", nativeEvent)) {
        event.preventDefault();
        Transforms.move(editor, { unit: "offset", reverse: true });
        return;
      }
      if (isKeyHotkey("right", nativeEvent)) {
        event.preventDefault();
        Transforms.move(editor, { unit: "offset" });
        return;
      }
    }
  };

  // const { insertText } = editor;
  // editor.insertText = (text) => {
  //   console.log({ text });
  //   insertText(text);
  // };
  return (
    <div className="">
      <Slate editor={editor} value={value} onChange={onChange}>
        {/* from https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx */}
        <div className="rounded-t-md dark:bg-zinc-600 max-w-prose">
          <MarkButton format="bold" editor={editor}>
            B
          </MarkButton>
          <MarkButton format="italic" editor={editor}>
            𝑖
          </MarkButton>
          <MarkButton format="underline" editor={editor}>
            ⎁
          </MarkButton>
          <MarkButton format="code" editor={editor}>
            `
          </MarkButton>
          <BlockButton format="heading-one" editor={editor}>
            H1
          </BlockButton>
          <BlockButton format="heading-two" editor={editor}>
            H2
          </BlockButton>
          <BlockButton format="block-quote" editor={editor}>
            "
          </BlockButton>
          <BlockButton format="bulleted-list" editor={editor}>
            ·.
          </BlockButton>
          <BlockButton format="numbered-list" editor={editor}>
            1.
          </BlockButton>
          <AddLinkButton />
          <RemoveLinkButton />
          <InsertImageButton />
          <ToggleEditableButtonButton />
        </div>
        <Editable
          className="prose prose-lg lg:prose-xl dark:prose-invert bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 px-4 py-2 rounded-b-md"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
            inlinesOnKeyDown(event);

            for (const hotkey in HOTKEYS) {
              if (isKeyHotkey(hotkey, event as any)) {
                event.preventDefault();
                const mark = HOTKEYS?.[hotkey] ?? "";
                toggleMark(editor, mark);
              }
            }

            if (isKeyHotkey("mod+`", event)) {
              event.preventDefault();
              const [match] = Editor.nodes(editor, {
                match: (n) => n.type === "code",
              });
              Transforms.setNodes(
                editor,
                { type: match ? "paragraph" : "code" },
                { match: (n) => Editor.isBlock(editor, n) },
              );
            }

            if (event.key === "&") {
              event.preventDefault();
              editor.insertText("and");
            }
          }}
        />
      </Slate>
    </div>
  );
};

type IBaseButton = DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  className?: string;
  children: ReactNode;
};
const BaseButton = ({ className, children, ...props }: IBaseButton) => (
  <button {...props} className={clsx("py-1 px-2", className)}>
    {children}
  </button>
);

type IButton = {
  editor: CustomEditor;
  format: string;
  children: ReactNode;
};

const MarkButton = ({ editor, format, children }: IButton) => {
  return (
    <BaseButton
      className={clsx(isMarkActive(editor, format) && "font-bold")}
      onMouseDown={(event) => toggleMark(editor, format)}
    >
      {children}
    </BaseButton>
  );
};

const BlockButton = ({ editor, format, children }: IButton) => {
  return (
    <BaseButton
      className={clsx(isBlockActive(editor, format) && "font-bold")}
      onMouseDown={(event) => toggleBlock(editor, format)}
    >
      {children}
    </BaseButton>
  );
};

const isMarkActive = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: CustomEditor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: CustomEditor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    }),
  );

  return !!match;
};

const toggleBlock = (editor: CustomEditor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type),
    split: true,
  });
  const newProperties: Partial<SlateElement> = {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  };
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

type IElementOrLeaf = {
  attributes: Record<any, any>;
  children: Array<ReactNode>;
};

type IElement = IElementOrLeaf & {
  element: SlateElement;
};

type ILeaf = IElementOrLeaf & {
  leaf: SlateElement;
};

const Leaf = ({ attributes, children, leaf }: ILeaf) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const Element = (props: IElement) => {
  // console.log("ELEMENT", { props });
  switch (props.element.type) {
    case "block-quote":
      return <blockquote {...props.attributes}>{props.children}</blockquote>;
    case "bulleted-list":
      return <ul {...props.attributes}>{props.children}</ul>;
    case "heading-one":
      return <h1 {...props.attributes}>{props.children}</h1>;
    case "heading-two":
      return <h2 {...props.attributes}>{props.children}</h2>;
    case "list-item":
      return <li {...props.attributes}>{props.children}</li>;
    case "numbered-list":
      return <ol {...props.attributes}>{props.children}</ol>;
    case "code":
      return <CodeBlockElement {...props} />;
    case "image":
      return <ImageComponent {...props} />;
    case "link":
      return <LinkComponent {...props} />;
    case "button":
      return <EditableButtonComponent {...props} />;
    default:
      return <DefaultElement {...props} />;
  }
};

const DefaultElement = (props) => {
  return <p {...props.attributes}>{props.children}</p>;
};

const CodeBlockElement = (props) => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
};

// from https://github.com/ianstormtaylor/slate/blob/main/site/examples/images.tsx
const withImages = (editor: CustomEditor) => {
  const { insertData, isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === "image" ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    const text = data.getData("text/plain");
    const { files } = data;

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        const [mime] = file.type.split("/");

        if (mime === "image") {
          reader.addEventListener("load", () => {
            const url = reader.result as string;
            insertImage(editor, url);
          });

          reader.readAsDataURL(file);
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

type EmptyText = {
  text: string;
};

type ImageElement = {
  type: "image";
  url: string;
  children: EmptyText[];
};

const insertImage = (editor: CustomEditor, url: string) => {
  const text = { text: "" };
  const image: ImageElement = { type: "image", url, children: [text] };
  Transforms.insertNodes(editor, image);
};

const ImageComponent = ({ attributes, children, element }) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);

  const selected = useSelected();
  const focused = useFocused();
  return (
    <div {...attributes}>
      {children}
      <div contentEditable={false} className="relative">
        <img
          src={element.url}
          className="block max-w-full max-h-80"
          // box-shadow: ${selected && focused ? "0 0 0 3px #B4D5FF" : "none"};
        />
        <BaseButton
          // active
          onClick={() => Transforms.removeNodes(editor, { at: path })}
          className={clsx(
            "absolute top-2 left-2 bg-white",
            selected && focused ? "inline" : "hidden",
          )}
        >
          delete
        </BaseButton>
      </div>
    </div>
  );
};

const InsertImageButton = () => {
  const editor = useSlateStatic();
  return (
    <BaseButton
      onMouseDown={(event) => {
        event.preventDefault();
        const url = window.prompt("Enter the URL of the image:") as string;
        if (url && !isImageUrl(url)) {
          alert("URL is not an image");
          return;
        }
        insertImage(editor, url);
      }}
    >
      🏞
    </BaseButton>
  );
};

const isUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (_e) {
    return false;
  }
};

const isImageUrl = (url: string) => {
  if (!url) return false;
  if (!isUrl(url)) return false;
  const ext = new URL(url).pathname.split(".")?.pop() ?? "";
  return imageExtensions.includes(ext);
};

type LinkElement = { type: "link"; url: string; children: Descendant[] };

const withInlines = (editor) => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element) =>
    ["link", "button"].includes(element.type) || isInline(element);

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data) => {
    const text = data.getData("text/plain");

    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

const insertLink = (editor: CustomEditor, url: string) => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};

const insertButton = (editor: CustomEditor) => {
  if (editor.selection) {
    wrapButton(editor);
  }
};

const isLinkActive = (editor: CustomEditor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  });
  return !!link;
};

const isButtonActive = (editor) => {
  const [button] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "button",
  });
  return !!button;
};

const unwrapLink = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  });
};

const unwrapButton = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "button",
  });
};

const wrapLink = (editor, url: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: LinkElement = {
    type: "link",
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: "end" });
  }
};

type ButtonElement = { type: "button"; children: Descendant[] };

const wrapButton = (editor) => {
  if (isButtonActive(editor)) {
    unwrapButton(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const button: ButtonElement = {
    type: "button",
    children: isCollapsed ? [{ text: "Edit me!" }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, button);
  } else {
    Transforms.wrapNodes(editor, button, { split: true });
    Transforms.collapse(editor, { edge: "end" });
  }
};

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span contentEditable={false} className="[font-size:0]">
    ${String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);

const LinkComponent = ({ attributes, children, element }) => {
  const selected = useSelected();
  return (
    <a
      {...attributes}
      href={element.url}
      className={clsx(selected && "shadow-sm")}
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </a>
  );
};

const EditableButtonComponent = ({ attributes, children }) => {
  return (
    /*
      Note that this is not a true button, but a span with button-like CSS.
      True buttons are display:inline-block, but Chrome and Safari
      have a bad bug with display:inline-block inside contenteditable:
      - https://bugs.webkit.org/show_bug.cgi?id=105898
      - https://bugs.chromium.org/p/chromium/issues/detail?id=1088403
      Worse, one cannot override the display property: https://github.com/w3c/csswg-drafts/issues/3226
      The only current workaround is to emulate the appearance of a display:inline button using CSS.
    */
    <span
      {...attributes}
      onClick={(ev) => ev.preventDefault()}
      // Margin is necessary to clearly show the cursor adjacent to the button
      className="mx-[0.1rem] py-1 px-2 bg-zinc-100 border border-slate-200 text-sm"
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </span>
  );
};

const AddLinkButton = () => {
  const editor = useSlate();
  return (
    <BaseButton
      // active={isLinkActive(editor)}
      onMouseDown={(event) => {
        event.preventDefault();
        const url = window.prompt("Enter the URL of the link:");
        if (!url) return;
        insertLink(editor, url);
      }}
    >
      link
    </BaseButton>
  );
};

const RemoveLinkButton = () => {
  const editor = useSlate();

  return (
    <BaseButton
      // active={isLinkActive(editor)}
      onMouseDown={(event) => {
        if (isLinkActive(editor)) {
          unwrapLink(editor);
        }
      }}
    >
      link_off
    </BaseButton>
  );
};

const ToggleEditableButtonButton = () => {
  const editor = useSlate();
  return (
    <BaseButton
      // active
      onMouseDown={(event) => {
        event.preventDefault();
        if (isButtonActive(editor)) {
          unwrapButton(editor);
        } else {
          insertButton(editor);
        }
      }}
    >
      smart_button
    </BaseButton>
  );
};

// from https://github.com/ianstormtaylor/slate/blob/main/site/examples/markdown-shortcuts.tsx
const withShortcuts = (editor) => {
  const { deleteBackward, insertText } = editor;

  editor.insertText = (text) => {
    const { selection } = editor;

    if (text === " " && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range);
      const type = SHORTCUTS[beforeText];

      if (type) {
        Transforms.select(editor, range);
        Transforms.delete(editor);
        const newProperties: Partial<SlateElement> = {
          type,
        };
        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: (n) => Editor.isBlock(editor, n),
        });

        if (type === "list-item") {
          const list: BulletedListElement = {
            type: "bulleted-list",
            children: [],
          };
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === "list-item",
          });
        }

        return;
      }
    }

    insertText(text);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      });

      if (match) {
        const [block, path] = match;
        const start = Editor.start(editor, path);

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== "paragraph" &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: "paragraph",
          };
          Transforms.setNodes(editor, newProperties);

          if (block.type === "list-item") {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === "bulleted-list",
              split: true,
            });
          }

          return;
        }
      }

      deleteBackward(...args);
    }
  };

  return editor;
};

type BulletedListElement = {
  type: "bulleted-list";
  children: Descendant[];
};
