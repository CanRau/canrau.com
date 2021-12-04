import { Link, LinksFunction } from "remix";
import styles from "~/styles/windicss/demos-about.css";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export default function AboutIndex() {
  return (
    <div>
      <p className="bg-green-600">
        You are looking at the index route for the <code>/about</code> URL
        segment, but there are nested routes as well!
      </p>
      <p>
        <strong>
          <Link to="whoa">Check out one of them here.</Link>
        </strong>
      </p>
    </div>
  );
}
