import { useEffect, useRef } from "react";

// note: useFirstRender hook from [SO](https://stackoverflow.com/a/63776262/3484824)
export function useFirstRender() {
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return isFirstRender.current;
}
