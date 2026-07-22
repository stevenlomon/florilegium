export const metadata = {
  title: "Privacy | Florilegium",
  description: "How we protect your digital renaissance book garden.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">Privacy</h1>
        <p className="text-[#5C613E] font-serif text-lg italic">
          A sanctuary means nothing if the walls are made of glass.
        </p>
      </header>

      <article className="max-w-3xl space-y-10 text-[#2C302E] font-serif leading-relaxed">

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            The Short Version
          </h2>
          <p className="mb-4">
            Florilegium is designed to be an antidote to the hyper-optimized, data-harvesting modern internet. We do not track your behavior. We do not sell your data. We do not use advertising pixels.
          </p>
          <p>
            Your reading garden is yours alone and will always be.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            What We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#5C613E]">
            <li><strong className="font-semibold text-[#2C302E]">Your Username & Password:</strong> Now in Beta, we won't ask for your email. Your password is irreversibly hashed and salted before it ever touches our database. We cannot see it, and we cannot recover it for you.</li>
            <li><strong className="font-semibold text-[#2C302E]">Your Library:</strong> The books you add, the statuses you set, the reviews you write, and the reading journeys you log are stored securely on our servers so you can access them across your devices.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Third-Party Services
          </h2>
          <p className="mb-4">
            To provide you with book covers, titles, and page count estimates, we rely on the open-source catalog at <strong><a href='https://openlibrary.org/developers'>Open Library</a></strong>.
          </p>
          <p className="text-[#5C613E]">
            When you search for a book, we send that search query to Open Library. However, we act as a proxy. Open Library sees that Florilegium is asking for a book, but they never see <em>who</em> you are.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Your Sovereignty
          </h2>
          <p className="mb-4">
            You own your intellectual journey. If you ever wish to delete a review, drop a book, or permanently delete your entire account, that data is wiped from our active databases. We do not maintain "ghost profiles" of our users.
          </p>
          <p className="text-[#5C613E] italic">
            Built with intention. Guarded with trust.
          </p>
        </section>

      </article>
    </div>
  )
};