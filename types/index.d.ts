import { type LoaderFunction } from "remix";
import { languages } from "/config";

export type Lang = typeof languages[number];

export type LoaderFunc<Params extends Record<string, unknown> = Record<string, unknown>> = (
  args: Omit<Parameters<LoaderFunction>["0"], "params"> & { params: Params },
) => ReturnType<LoaderFunction>;
