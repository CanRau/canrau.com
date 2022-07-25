import { useReducer, useCallback, useEffect, useRef } from "react";

// from https://twitter.com/FernandoTheRojo/status/1521305729558274048
// from https://twitter.com/markdalgleish/status/1521304112738217984
// export const useToggle = () => {
//   return useReducer((s: boolean) => !s, false);
// };

// alternative approach

export type Callback<S> = (
  state: S,
) => (void | Promise<void>) | (() => void | Promise<void> | undefined);

export type BooleanCallback = Callback<boolean>;

// note: arrow function overloading
// type IUseToggle = {
//   (
//     initialState: boolean,
//   ): [boolean, (state?: BooleanCallback) => void];
//   (
//     initialState: boolean,
//   ): [boolean, (state?: BooleanCallback) => void];
//   (
//     initialState: boolean,
//     callback: BooleanCallback,
//   ): [boolean, (state?: BooleanCallback) => void];
// }

/**
 *
 * @param [initialState] boolean default false
 * @param [callback] function which receives the current state of the toggle
 * @returns
 */
export const useToggle = (
  initialState = false,
  callback?: BooleanCallback,
): [boolean, (state?: BooleanCallback) => void] => {
  const callbackRef = useRef<BooleanCallback | null>(null);
  const [state, toggleState] = useReducer((s: boolean) => !s, initialState);

  useEffect(() => {
    if (typeof callback === "function") callback(state);

    if (typeof callbackRef.current === "function") {
      callbackRef.current(state);

      callbackRef.current = null;
    }
  }, [state, callback]);

  const toggle = useCallback((cb): void => {
    toggleState();
    callbackRef.current = cb;
  }, []);

  return [state, toggle];
};
