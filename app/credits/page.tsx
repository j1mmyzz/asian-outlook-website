import Link from "next/link";

export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-neutral-900">
      <section className="flex items-center justify-center px-6 py-32">
        <div className="max-w-2xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
            Asian Outlook
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Credits
          </h1>

          <p className="mt-8 text-lg text-neutral-700">Site made by</p>
          <span className="text-[80px] font-extrabold text-black">
            Jimmy Zheng
          </span>

          <p className="mt-4 text-lg text-neutral-700">
            Thank you to everyone who contributed to the magazine.
          </p>

          <div className="mt-10">
            <Link
              href="/"
              className="rounded-full bg-blue-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-900"
            >
              Back Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
