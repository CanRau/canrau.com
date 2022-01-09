import { Lang } from "/types";

export const isProd = process.env.NODE_ENV === "production";
export const isContainer = process.env.OS_ENV === "container";

export const domain: string = "CanRau.com";

export const author: string = "Can Rau";
export const twitterHandle: string = "@CanRau";
export const twitterId: string = "59203844";

export const titleSeperator: string = " — ";

export const rootUrl: string = "https://www.canrau.com";

// note: use [enums](https://www.typescriptlang.org/docs/handbook/enums.html)? probably not necessary
export const languages = ["en"] as const;

export const defaultLang = languages[0] as Lang;

// todo: add more user profiles, maybe change implementation
export const profiles: Array<string> = [
  "https://twitter.com/CanRau",
  "https://stackoverflow.com/users/3484824/can-rau",
];
