import { useState } from "react";
import {
  json,
  type RouteHandle,
  type LoaderFunction,
  useParams,
  LinksFunction,
} from "remix";
import { type Descendant } from "slate";
import { RteEditor } from "~/components/rte/editor";
import { requireUserId } from "./session.server";

export const handle: RouteHandle = {
  hydrate: true,
};

export const links: LinksFunction = () => {
  return [];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request, params);
  return json({});
};

export default function Admin() {
  const { id } = useParams<"id">();
  const initialValue: Descendant[] = [
    {
      type: "paragraph",
      children: [{ text: "A line of text in a paragraph." }],
    },
  ];
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const onChange = (value: Descendant[]) => {
    console.log(value);
    setValue(value);
  };
  return <RteEditor value={value} onChange={onChange} />;
}
