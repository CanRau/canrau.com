import { useParams } from "remix";
import { defaultLang, languages } from "/config";
import { Lang } from "/types";

export const useLang = () => {
  const { lang } = useParams<"lang">();
  return languages.includes(lang as Lang) ? (lang as Lang) : defaultLang;
};
