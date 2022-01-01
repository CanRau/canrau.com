import { NavLink, Outlet } from "remix";
import { Document } from "~/components/document";
import { useLang } from "~/hooks/useLang";

export default function AdminLayout() {
  const lang = useLang();
  return (
    <Document lang={lang}>
      <div className="grid grid-cols-12 Xgrid-cols-layout gap-10">
        <header className="col-span-full">Menu</header>
        <menu className="col-span-2">
          <NavLink to="/">Dashboard</NavLink>
        </menu>
        <div className="col-span-10">
          <Outlet />
        </div>
      </div>
    </Document>
  );
}
