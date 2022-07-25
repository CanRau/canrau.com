import { useCallback, useEffect, useRef, useState } from "react";

export type Callback<S> = (
  state: S,
) => (void | Promise<void>) | (() => void | Promise<void> | undefined);

export const useStateWithCallback = <S>(
  initialState: S | (() => S),
  callback?: Callback<S>,
): [S, (state: S, callback?: Callback<S>) => void] => {
  const callbackRef = useRef<Callback<S> | null>(null);
  const [state, _setState] = useState(initialState);

  useEffect(() => {
    if (typeof callback === "function") {
      callback(state);
    }

    if (typeof callbackRef.current === "function") {
      callbackRef.current(state);
      callbackRef.current = null;
    }
  }, [state, callback]);

  const setState = useCallback((state, callback): void => {
    _setState(state);
    callbackRef.current = callback;
  }, []);

  return [state, setState];
};
