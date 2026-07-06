import { useEffect, useId, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, navigate } from "../lib/router";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/magazines", label: "Magazines" },
  { href: "/blogs", label: "Blogs" },
  { href: "/newsletters", label: "Newsletters" },
  { href: "/media-production", label: "Media Production" },
  { href: "/about", label: "About Us" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar({ pathname }: { pathname: string }) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setLoggedIn(Boolean(session));
        setLoadingAuth(false);
      }
    }

    loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const linkClass = (href: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 ${
      isActive(pathname, href)
        ? "bg-blue-950 text-white"
        : "text-neutral-700 hover:bg-white hover:text-neutral-950"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-slate-100/95 backdrop-blur-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-950 focus:outline focus:outline-2 focus:outline-blue-950"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-10">
        <Link
          href="/"
          className="shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-950"
          ariaLabel="Asian Outlook home"
        >
          <span className="flex items-center gap-3">
            <img
              className="h-10 w-10"
              src="/AO_Logo_No_Background.png"
              alt=""
              aria-hidden="true"
            />
            <span className="text-base font-semibold tracking-tight text-neutral-950">
              Asian Outlook
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              ariaCurrent={isActive(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/search"
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
            ariaCurrent={pathname === "/search" ? "page" : undefined}
          >
            Search
          </Link>

          {!loadingAuth && !loggedIn && (
            <Link
              href="/admin/login"
              className="rounded-full bg-blue-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              ariaCurrent={pathname === "/admin/login" ? "page" : undefined}
            >
              Admin Login
            </Link>
          )}

          {!loadingAuth && loggedIn && (
            <>
              <Link
                href="/admin"
                className="rounded-full bg-blue-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
                type="button"
              >
                Sign Out
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white p-2 text-neutral-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 xl:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls={menuId}
          aria-expanded={menuOpen}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      <div
        id={menuId}
        className={`border-t border-neutral-200/70 bg-slate-100 xl:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <nav
          className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 md:px-10"
          aria-label="Mobile primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 ${
                isActive(pathname, link.href)
                  ? "bg-blue-950 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700"
              }`}
              ariaCurrent={isActive(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/search"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
            ariaCurrent={pathname === "/search" ? "page" : undefined}
          >
            Search
          </Link>

          {!loadingAuth && !loggedIn && (
            <Link
              href="/admin/login"
              className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
            >
              Admin Login
            </Link>
          )}

          {!loadingAuth && loggedIn && (
            <>
              <Link
                href="/admin"
                className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
                type="button"
              >
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
