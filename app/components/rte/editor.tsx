// todo: add [slate-edit-list](https://github.com/productboard/slate-edit-list)
// [remark-slate](https://github.com/hanford/remark-slate)
import { useCallback, useMemo, ReactNode } from "react";
import {
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
  type BaseEditor,
  type Descendant,
} from "slate";
import { Slate, Editable, withReact, type ReactEditor } from "slate-react";
import { type HistoryEditor, withHistory } from "slate-history";
import { isKeyHotkey } from "is-hotkey";
import clsx from "clsx";
import { MouseEventHandler } from "react";

const HOTKEYS: Record<string, string> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  // "mod+`": "code",
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
  const editor = useMemo(() => withReact(withHistory(createEditor())), []);
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  // const { insertText } = editor;
  // editor.insertText = (text) => {
  //   console.log({ text });
  //   insertText(text);
  // };
  return (
    <div className="">
      <Slate editor={editor} value={value} onChange={onChange}>
        <div className="rounded-t-md dark:bg-zinc-600 max-w-prose">
          <MarkButton format="bold" editor={editor}>
            B
          </MarkButton>
          <BlockButton format="heading-one" editor={editor}>
            H1
          </BlockButton>
        </div>
        <Editable
          className="prose prose-lg lg:prose-xl dark:prose-invert bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 px-4 py-2 rounded-b-md"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
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

type IBaseButton = {
  className: string;
  onMouseDown: MouseEventHandler<HTMLButtonElement>;
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

const isBlockActive = (editor, format) => {
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
  switch (props.element.type) {
    case "block-quote":
      return <blockquote {...props} />;
    case "bulleted-list":
      return <ul {...props} />;
    case "heading-one":
      return <h1 {...props} />;
    case "heading-two":
      return <h2 {...props} />;
    case "list-item":
      return <li {...props} />;
    case "numbered-list":
      return <ol {...props} />;
    case "code":
      return <CodeBlockElement {...props} />;
    default:
      return <DefaultElement {...props} />;
  }
};

const DefaultElement = (props) => {
  return <p {...props}>{props.children}</p>;
};

const CodeBlockElement = (props) => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
};
