import { Lang } from "/types";

export const domain: string = "CanRau.com";

export const author: string = "Can Rau";
export const twitterHandle: string = "@CanRau";

export const titleSeperator: string = " — ";

export const rootUrl: string = "https://www.canrau.com";

// note: use [enums](https://www.typescriptlang.org/docs/handbook/enums.html)? probably not necessary
export const languages = ["en"] as const;

export const defaultLang = languages[0] as Lang;