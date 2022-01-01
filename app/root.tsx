import { type LinksFunction, Outlet } from "remix";
import tailwindStyles from "~/styles/tailwind.css";

export let links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStyles },
    // {
    //   rel: "stylesheet",
    //   href: darkStylesUrl,
    //   media: "(prefers-color-scheme: dark)",
    // },
    // { rel: "shortcut icon", type: "image/jpg", href: favicon },
  ];
};

export default function App() {
  return <Outlet />;
}
