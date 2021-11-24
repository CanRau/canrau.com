import type { MetaFunction, LoaderFunction } from "remix";
import { useLoaderData, json, Link, redirect } from "remix";

type IndexData = {
  resources: Array<{ name: string; url: string }>;
  demos: Array<{ name: string; to: string }>;
};

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
export let loader: LoaderFunction = ({ params }) => json({ params });

export default function CatchAll() {
  const data = useLoaderData();
  console.log({ data });
  return <h1>Data</h1>;
}
