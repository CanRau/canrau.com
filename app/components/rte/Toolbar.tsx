import clsx from "clsx";
import { MouseEvent, MouseEventHandler, ReactNode } from "react";
import { Editor } from "slate";
import { useFocused, useSlate } from "slate-react";

import { lists } from "./lists";
import toggleBlock from "./toggleBlock";
import { ElementType } from "./types";

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

const Toolbar = () => {
  const isFocused = useFocused();
  const editor = useSlate();
  const selectedEntries = Array.from(Editor.nodes(editor));
  const listEntries = lists.getListsInRange(editor, editor.selection);
  const paragraphEntries = selectedEntries.filter(
    ([node]) => node.type === ElementType.PARAGRAPH,
  );
  const olEntries = listEntries.filter(
    ([node]) => node.type === ElementType.ORDERED_LIST,
  );
  const ulEntries = listEntries.filter(
    ([node]) => node.type === ElementType.UNORDERED_LIST,
  );

  const handleMouseDown = (event: MouseEvent<HTMLElement>) => {
    // prevent editor from losing focus and selection when interacting with buttons
    event.preventDefault();
  };

  const handleSetParagraph = () => {
    lists.unwrapList(editor);
  };

  const handleSetOrderedList = () => {
    toggleBlock(editor, lists, "ordered-list");
  };

  const handleSetUnorderedList = () => {
    toggleBlock(editor, lists, "unordered-list");
  };

  const handleDecreaseDepth = () => {
    lists.decreaseDepth(editor);
  };

  const handleIncreaseDepth = () => {
    lists.increaseDepth(editor);
  };

  return (
    <div className="toolbar">
      <Button.Group
        buttons={[
          {
            active: paragraphEntries.length > 0,
            disabled: !isFocused,
            icon: "paragraph",
            key: "paragraph",
            title: "lists.unwrapList(editor)",
            onClick: handleSetParagraph,
            onMouseDown: handleMouseDown,
          },
          {
            active: olEntries.length > 0,
            disabled: !isFocused,
            icon: "list ol",
            key: "ordered-list",
            title: "toggleBlock(editor, lists, 'ordered-list')",
            onClick: handleSetOrderedList,
            onMouseDown: handleMouseDown,
          },
          {
            active: ulEntries.length > 0,
            disabled: !isFocused,
            icon: "list ul",
            key: "unordered-list",
            title: "toggleBlock(editor, lists, 'unordered-list')",
            onClick: handleSetUnorderedList,
            onMouseDown: handleMouseDown,
          },
          {
            disabled: !isFocused,
            icon: "outdent",
            key: "decreaseDepth",
            title: "lists.decreaseDepth(editor)",
            onClick: handleDecreaseDepth,
            onMouseDown: handleMouseDown,
          },
          {
            disabled: !isFocused,
            icon: "indent",
            key: "increaseDepth",
            title: "lists.increaseDepth(editor)",
            onClick: handleIncreaseDepth,
            onMouseDown: handleMouseDown,
          },
        ]}
      />

      {!isFocused && (
        <span
          className="toolbar-tooltip"
          title="Focus the editor to enable controls"
        >
          Focus the editor to enable controls
        </span>
      )}
    </div>
  );
};

export default Toolbar;
