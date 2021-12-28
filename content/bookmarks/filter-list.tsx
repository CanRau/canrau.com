import { ChangeEvent, useState } from "react";
import { matchSorter } from "match-sorter";
import TwitterShareButton from "react-share/lib/TwitterShareButton";
import { FaTwitter } from "react-icons/fa";
// todo: use [truncate-url](https://github.com/sindresorhus/truncate-url) once figured out how to use ESM or being properly supported?
import { truncateSmart } from "autolinker/dist/commonjs/truncate/truncate-smart.js";
import { twitterHandle } from "/config";

type Bookmark = {
  title: string;
  url: string;
  description: string;
  timeAdded: string;
  tags: Array<string>;
};

type IFilterList = {
  items: Array<Bookmark>;
};

const sorter = (a, b) => (a.item.timeAdded > b.item.timeAdded ? -1 : 1);

const getFiltered = (
  items: Array<Bookmark>,
  keys: Array<string>,
  term: string,
) => {
  if (!term || !term.length) {
    return items;
  }

  const terms = term.split(" ");
  if (!terms) {
    return items;
  }

  return terms.reduceRight(
    (results, term) => matchSorter(results, term, { keys }),
    items,
  );
};

export const FilterList = ({ items }: IFilterList) => {
  const [term, setTerm] = useState("");

  // const sorted = matchSorter(items, term, {
  //   keys: ["title", "url", "description", "tags"],
  //   baseSort: sorter,
  //   // sorter: (rankedItems) => rankedItems.sort(sorter),
  // });

  const sorted = getFiltered(
    items,
    ["title", "url", "description", "tags"],
    term,
  );

  const listItems = sorted.map((item) => (
    <li key={item.url}>
      <div className="space-x-4">
        <a href={item.url}>{item.title}</a>
        <label title="Share bookmark to Twitter">
          <TwitterShareButton
            title={`${item.title} via ${twitterHandle}\n`}
            url={item.url}
          >
            <FaTwitter className="text-[#1d9cf0] text-opacity-70" />
          </TwitterShareButton>
        </label>
      </div>
      {item.description ? (
        <div className="text-skin-text-dark">{item.description}</div>
      ) : (
        ""
      )}
      <div className="text-sm text-skin-text-darker" title={item.url}>
        {truncateSmart(item.url, 60, "[..]")}
      </div>
    </li>
  ));

  const onChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setTerm(e.target.value);

  return (
    <div className="not-prose space-y-16">
      <label>
        <span>Search through the bookmarks</span>
        <input
          placeholder="Search term"
          type="text"
          value={term}
          onChange={onChange}
          className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
        />
      </label>
      <ul className="list-none space-y-10">{listItems}</ul>
    </div>
  );
};
