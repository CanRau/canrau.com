import { json, type RouteHandle, type LoaderFunction } from "remix";
import { requireUserId } from "./session.server";

export const handle: RouteHandle = {
  hydrate: true,
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request, params);
  return json({});
};

export default function Admin() {
  return <div>Admin Index</div>;
}
