import { LoaderFunction } from "remix";

export type IGetTotalPathVisits = {
  path: string;
  endpoint: string;
  isVerbose: boolean;
};

export const loader: LoaderFunction = async ({ request }) => {
  const DB_ENDPOINT = process.env.DB_ENDPOINT ?? "";
  const url = new URL(request.url);
  const visitsConf: IGetTotalPathVisits = {
    path: url.pathname,
    endpoint: DB_ENDPOINT,
    isVerbose: true,
  };
  const totalPathVisits = DB_ENDPOINT
    ? await getTotalPathVisits(visitsConf)
    : 0;

  return totalPathVisits;
};

export const getTotalPathVisits = async ({
  path,
  endpoint,
  isVerbose,
}: IGetTotalPathVisits): Promise<number> => {
  try {
    const totalVisitsRes = await fetch(`${endpoint}/visit/get/path-count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (totalVisitsRes.ok) {
      const totalVisitsJson = await totalVisitsRes.json();
      return totalVisitsJson.data;
    }
  } catch (error) {
    if (isVerbose) {
      console.log(error);
    }
  }
  return 0;
};
