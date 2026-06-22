import { Link } from "@tanstack/react-router";
import { Library, LayoutGrid, Gamepad2, Search } from "lucide-react";
import type { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-brand)] text-brand-foreground">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <span>SteamStats</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            <NavLink to="/" icon={<LayoutGrid className="h-4 w-4" />}>Dashboard</NavLink>
            <NavLink to="/catalog" icon={<Search className="h-4 w-4" />}>Catalogo</NavLink>
            <NavLink to="/library" icon={<Library className="h-4 w-4" />}>Libreria</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium">Player_01</div>
              <div className="text-xs text-muted-foreground">Lvl 42</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 font-semibold text-brand">
              P
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          <NavLink to="/" icon={<LayoutGrid className="h-4 w-4" />}>Dashboard</NavLink>
          <NavLink to="/catalog" icon={<Search className="h-4 w-4" />}>Catalogo</NavLink>
          <NavLink to="/library" icon={<Library className="h-4 w-4" />}>Libreria</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "bg-surface-2 text-foreground" }}
    >
      {icon}
      {children}
    </Link>
  );
}
