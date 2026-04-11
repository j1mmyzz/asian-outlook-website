import Link from "next/link";

const boardSections = [
  {
    title: "Leadership",
    members: [
      { role: "President", names: ["Rui Zheng"] },
      { role: "Vice President", names: ["Anderson Li"] },
      { role: "Secretary", names: ["Stephanie Zhou"] },
    ],
  },
  {
    title: "Editorial Team",
    members: [
      { role: "Editor-In-Chief", names: ["Kate Sum"] },
      { role: "Conscience Editor", names: ["Shirley Zhang"] },
      { role: "Copy Editors", names: ["Annie Ngo", "Ellie Kim", "Lauren Jim"] },
      { role: "Copy Interns", names: ["Ava Gabriel", "Lindsay Chen"] },
    ],
  },
  {
    title: "Layout Team",
    members: [
      {
        role: "Layout Editors",
        names: ["Ianna Choi", "Jimmy Zheng", "Kimberly Cheong", "Mandy Guan"],
      },
      { role: "Layout Interns", names: ["Lise Kubota", "Reema Kaur"] },
    ],
  },
  {
    title: "Operations",
    members: [
      { role: "Publicity Chairs", names: ["Kristen Li", "Suguru D’Agostino"] },
      { role: "Fundraising Chair", names: ["Madison Hernandez"] },
      { role: "Event Coordinators", names: ["Andy Huang", "Madison Lee"] },
      { role: "Political Coordinator", names: ["Grace Lim"] },
      { role: "Historians", names: ["Jacky Jiang", "Lia Tsin"] },
    ],
  },
  {
    title: "Media Team",
    members: [
      {
        role: "Media Producers",
        names: ["Brady Overtoom", "Donovan Lai", "Jasmin Pais", "Lydia Luo"],
      },
    ],
  },
  {
    title: "Additional Staff",
    members: [
      { role: "Senior Advisor", names: ["Carmen Tan"] },
      {
        role: "General Interns",
        names: [
          "Andrea Hsu",
          "Gabriel Marasigan",
          "Ryan Shin",
          "Scarlett Kennedy",
        ],
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-neutral-900">
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
              Asian Outlook
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-neutral-950 md:text-6xl">
              About Us
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-700">
              Asian Outlook serves as the creative, literary, and political arm
              of the Asian Student Union at Binghamton University. Through
              magazines, blogs, newsletters, and multimedia production, we aim
              to amplify student voices and build space for expression,
              reflection, and community.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-950">
            Spring 2026
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
            Executive Board
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            Meet the team behind Asian Outlook’s publications, events, and media
            projects.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {boardSections.map((section) => (
            <div
              key={section.title}
              className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
                {section.title}
              </h3>

              <div className="mt-5 space-y-5">
                {section.members.map((member) => (
                  <div key={member.role}>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-950">
                      {member.role}
                    </p>
                    <div className="mt-2 space-y-1">
                      {member.names.map((name) => (
                        <p key={name} className="text-base text-neutral-700">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/magazines"
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-950"
          >
            Explore Magazines
          </Link>
        </div>
      </section>
    </main>
  );
}
