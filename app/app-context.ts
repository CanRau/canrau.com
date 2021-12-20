import { createContext } from "react";

export const AppContext = createContext({
  // totalPathVisits: 0,
  // path: "",
  // setPageViewCountForPath: (path: string, visits: number) => {},
  setPageViewCountForPath: (visits: number) => {},
});
