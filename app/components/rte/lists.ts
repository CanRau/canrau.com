import {
  Lists,
  ListsOptions,
  withLists,
  withListsReact,
} from "@prezly/slate-lists";

export const listsOptions: ListsOptions = {
  defaultBlockType: "paragraph",
  listItemTextType: "list-item-text",
  listItemType: "list-item",
  listTypes: ["unordered-list", "ordered-list"],
  wrappableTypes: ["paragraph"],
};

export const plugins = [withLists(listsOptions), withListsReact];

export const lists = Lists(listsOptions);
