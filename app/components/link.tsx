import { forwardRef } from "react";
import { Link as RemixLink } from "remix";
import { type RemixLinkProps } from "@remix-run/react/components";
import isAbsolute from "is-absolute-url";

// from coding4.gaiama
// const isAnchor = (url: string) => /^#/.test(url);
// const isFqdn = (url: string) => !/^\/(?!\/)/.test(url);

type LinkProps = RemixLinkProps & {
  href: string;
};

export const Link = forwardRef<HTMLAnchorElement, RemixLinkProps>(
  function WrappedLink(
    { href, to, prefetch = "intent", ...rest },
    forwardedRef,
  ) {
    const destination = href ?? to;

    if (isAbsolute(destination)) {
      const { children, ...props } = rest;
      return (
        <a
          {...props}
          href={destination}
          ref={forwardedRef}
          className="with-icon-right [--ggs:0.8]"
        >
          {children}
          <i className="gg-external" />

          {/* icon by https://instance-factory.com/?p=2083 */}
          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            width="15"
            height="15"
            className="inline ml-1"
          >
            <g stroke="currentColor" strokeWidth="1">
              <line x1="5" y1="5" x2="5" y2="14" />
              <line x1="14" y1="9" x2="14" y2="14" />
              <line x1="5" y1="14" x2="14" y2="14" />
              <line x1="5" y1="5" x2="9" y2="5" />
              <line x1="10" y1="2" x2="17" y2="2" />
              <line x1="17" y1="2" x2="17" y2="9" />
              <line x1="10" y1="9" x2="17" y2="2" strokeWidth="1.5" />
            </g>
          </svg> */}

          {/* icon by https://reactjs.org/ */}
          {/* prettier-ignore */}
          {/* <svg x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15">
            <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"/>
            <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"/>
          </svg> */}
        </a>
      );
    }

    return (
      <RemixLink
        prefetch={prefetch}
        {...rest}
        to={destination}
        ref={forwardedRef}
      />
    );
  },
);
