import { memo, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// @note: found [in](https://github.com/iskanderbroere/remix-material-ui-example/blob/6aa3810935f9003974940ef771cb9bada2335993/app/root.tsx#L284) via [discord](https://discord.com/channels/770287896669978684/770287896669978687/929260002605158400)
export const RouteChangeAnnouncement = memo(() => {
  const [hydrated, setHydrated] = useState(false);
  const [innerHtml, setInnerHtml] = useState("");
  const location = useLocation();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const firstRenderRef = useRef(true);
  useEffect(() => {
    // Skip the first render because we don't want an announcement on the
    // initial page load.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    const pageTitle = location.pathname === "/" ? "Home page" : document.title;
    setInnerHtml(`Navigated to ${pageTitle}`);
  }, [location.pathname]);

  // Render nothing on the server. The live region provides no value unless
  // scripts are loaded and the browser takes over normal routing.
  if (!hydrated) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      aria-atomic
      id="route-change-region"
      style={{
        border: "0",
        clipPath: "inset(100%)",
        clip: "rect(0 0 0 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: "0",
        position: "absolute",
        width: "1px",
        whiteSpace: "nowrap",
        wordWrap: "normal",
      }}
    >
      {innerHtml}
    </div>
  );
});
RouteChangeAnnouncement.displayName = "RouteChangeAnnouncement";
