import Link from "next/link";
import { FaInstagram, FaTiktok, FaLink } from "react-icons/fa";
export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Asian Outlook
                </h3>
                <p className="text-sm text-neutral-400">
                  Creative, Literary and Political arm of the Asian Student
                  Union at Binghamton University
                </p>
              </div>
              <div className="flex gap-3 mt-10">
                <a
                  href="https://www.instagram.com/asianoutlook/"
                  className="text-white transition"
                  target="_blank"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://www.tiktok.com/@bingasianoutlook"
                  className="text-white transition"
                  target="_blank"
                >
                  <FaTiktok />
                </a>

                <a
                  href="https://linktr.ee/asianoutlook"
                  target="_blank"
                  className="text-white transition"
                >
                  <FaLink />
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Explore
            </h4>
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
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              More
            </h4>
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
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-neutral-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Asian Outlook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
