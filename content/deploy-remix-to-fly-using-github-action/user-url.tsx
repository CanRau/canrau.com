import {
  useState,
  useRef,
  type ChangeEvent,
  type ReactNode,
  type KeyboardEvent,
} from "react";

type Props = {
  initial: string;
  prefix: string;
  suffix: string;
};

// ReactNode via https://www.carlrippon.com/react-children-with-typescript/
const Wrapper = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
);

export const UserUrl = ({ initial = "", prefix = "", suffix = "" }: Props) => {
  const [value, setValue] = useState("");
  const link = useRef();

  // types from https://stackoverflow.com/a/70095204/3484824
  const onChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    e.preventDefault();
    setValue(e.target.value);
  };

  const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.code === "Enter") {
      (link?.current as unknown as HTMLAnchorElement)?.click();
    }
  };

  const input = (
    <div>
      <input
        className="w-full bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
        type="text"
        placeholder={initial}
        value={value}
        onChange={onChange}
        onKeyUp={onKeyUp}
      />
    </div>
  );

  // value needs to include at least 1 character followed by / and a nother character
  if (/[^/<>?]+\/[^/<>?]+/.test(value)) {
    return (
      <Wrapper>
        {input}
        <div className="mt-2">
          <a
            ref={link.current}
            href={`${prefix}${value || initial}${suffix}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            hit enter or click to go to your repo's settings
          </a>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {input}
      <div className="mt-2">
        <span>
          type your GitHub username/repo to generate the settings link
        </span>
      </div>
    </Wrapper>
  );
};
