import { FaInstagram, FaLink, FaTiktok } from "react-icons/fa";
import { Link } from "../lib/router";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Asian Outlook
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
              Creative, Literary and Political arm of the Asian Student Union
              at Binghamton University
            </p>
            <div className="mt-10 flex gap-3">
              <Link
                href="https://www.instagram.com/asianoutlook/"
                ariaLabel="Asian Outlook on Instagram"
                className="text-white transition hover:text-blue-300 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <FaInstagram aria-hidden="true" focusable="false" />
              </Link>
              <Link
                href="https://www.tiktok.com/@bingasianoutlook"
                ariaLabel="Asian Outlook on TikTok"
                className="text-white transition hover:text-blue-300 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <FaTiktok aria-hidden="true" focusable="false" />
              </Link>
              <Link
                href="https://linktr.ee/asianoutlook"
                ariaLabel="Asian Outlook Linktree"
                className="text-white transition hover:text-blue-300 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <FaLink aria-hidden="true" focusable="false" />
              </Link>
            </div>
          </div>

          <nav aria-label="Footer explore links">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Explore
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-300">
              <Link href="/magazines" className="transition hover:text-white">
                Magazines
              </Link>
              <Link href="/blogs" className="transition hover:text-white">
                Blogs
              </Link>
              <Link href="/newsletters" className="transition hover:text-white">
                Newsletters
              </Link>
              <Link
                href="/media-production"
                className="transition hover:text-white"
              >
                Media Production
              </Link>
            </div>
          </nav>

          <nav aria-label="Footer secondary links">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              More
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-300">
              <Link href="/about" className="transition hover:text-white">
                About Us
              </Link>
              <Link href="/search" className="transition hover:text-white">
                Search
              </Link>
              <Link href="/admin/login" className="transition hover:text-white">
                Admin Login
              </Link>
              <Link href="/credits" className="transition hover:text-white">
                Credits
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-neutral-400">
          <p>© 2026 Asian Outlook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
