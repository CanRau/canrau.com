import { Outlet, type LoaderFunction, useLoaderData } from "remix";
// import {
//   getTotalPathVisits,
//   IGetTotalPathVisits,
// } from "~/utils/get-total-path-visits";

// export const loader: LoaderFunction = async ({ request }) => {
//   const DB_ENDPOINT = process.env.DB_ENDPOINT ?? "";
//   const url = new URL(request.url);
//   const visitsConf: IGetTotalPathVisits = {
//     path: url.pathname,
//     endpoint: DB_ENDPOINT,
//     isVerbose: true,
//   };
//   const totalPathVisits = DB_ENDPOINT
//     ? await getTotalPathVisits(visitsConf)
//     : 0;

//   return { totalPathVisits, path: url.pathname };
// };

export default function LangLayout() {
  return (
    <>
      {/* <h1>Layout</h1> */}
      <Outlet />
    </>
  );
}
