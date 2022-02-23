// todo: make a <aside/> component for note, info, warning etc
// inspired by https://www.joshwcomeau.com/css/styled-components/

import { ReactNode } from "react";

type AsideProps = {
  children: ReactNode | Array<ReactNode>;
};

export const Aside = ({ children }: AsideProps) => {
  return <aside>{children}</aside>;
};
