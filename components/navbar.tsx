"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Home" },
  { href: "/magazines", label: "Magazines" },
  { href: "/blogs", label: "Blogs" },
  { href: "/newsletters", label: "Newsletters" },
  { href: "/media-production", label: "Media Production" },
  { href: "/about", label: "About Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();

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
        setLoggedIn(!!session);
        setLoadingAuth(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-slate-100/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-10">
        <Link href="/" className="shrink-0">
          <div className="flex items-center gap-3">
            <img
              className="h-10 w-10"
              src="/AO_Logo_No_Background.png"
              alt="Asian Outlook Logo"
            />
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight text-neutral-950">
                Asian Outlook
              </p>
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? "bg-blue-950 text-white"
                  : "text-neutral-700 hover:bg-white hover:text-neutral-950"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/search"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            Search
          </Link>

          {!loadingAuth && !loggedIn && (
            <Link
              href="/admin/login"
              className="rounded-full bg-blue-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Admin Login
            </Link>
          )}

          {!loadingAuth && loggedIn && (
            <>
              <Link
                href="/admin"
                className="rounded-full bg-blue-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                Sign Out
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white p-2 text-neutral-900 shadow-sm xl:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200/70 bg-slate-100 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 md:px-10">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-blue-950 text-white"
                    : "border border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/search"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800"
            >
              Search
            </Link>

            {!loadingAuth && !loggedIn && (
              <Link
                href="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-medium text-white"
              >
                Admin Login
              </Link>
            )}

            {!loadingAuth && loggedIn && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-medium text-white"
                >
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-neutral-800"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
