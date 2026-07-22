export const metadata = {
  title: "Help | Florilegium",
  description: "A guide to your digital renaissance book garden.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">A Guide to Your Garden</h1>
        <p className="text-[#5C613E] font-serif text-lg italic">
          Everything you need to know to cultivate your library.
        </p>
      </header>

      <article className="max-w-3xl space-y-12 text-[#2C302E] font-serif leading-relaxed">

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            The Horizon
          </h2>
          <p className="mb-4">
            Found on your Profile, the Horizon is a curated queue of up to five masterpieces. These are not passing curiosities; they are the dense, meaningful books you are actively cultivating momentum towards.
          </p>
          <p>
            By capping this at five slots, we prioritize intention over accumulation. When a slot empties, it feels more substantial, like an event. It becomes an opportunity to thoughtfully select your next great undertaking.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            The Bookshelf
          </h2>
          <p className="mb-4">
            Your Bookshelf is your master archive. Every book you add from the search bar lands here first. From your Bookshelf, you can rate works, log past reading journeys, leave polished reviews, and record recommendation contexts.
          </p>
          <p className="text-[#5C613E] italic text-sm">
            Note: You cannot assign a book to &quot;Currently Reading&quot; directly from the Bookshelf. Active reading is handled exclusively in your Reading Tracks to maintain focus.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Reading Tracks
          </h2>
          <p className="mb-4">
            Your Reading Tracks act as your active workbench. To prevent the overwhelm of reading too many things at once, you are limited to three specific tracks (e.g., Fiction, Non-fiction, Before Bedtime).
            While these are your defaults, their names and descriptions can be edited to your hearts desire.
          </p>
          <p className="mb-4">
            Each track holds exactly two slots:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#5C613E]">
            <li><strong className="font-semibold text-[#2C302E]">Currently Reading:</strong> The book you are actively engaged with right now. You can update your page progress directly on the card.</li>
            <li><strong className="font-semibold text-[#2C302E]">Up Next:</strong> The designated follow-up. When you finish your current book, this follow-up is automatically promoted into your active slot, keeping your reading momentum alive.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Reading Journeys & Reviews
          </h2>
          <p className="mb-4">
            Every time you read a book, a <i>Reading Journey</i> is logged. You can read a book multiple times, and each iteration will be saved to your timeline with its own start and end dates.
          </p>
          <p>
            When you finish a book, you&apos;ll be prompted to capture your <i>raw thoughts</i>; the immediate, unpolished feelings you have upon turning the last page. These are saved to your timeline alongside your polished, overarching review on the Bookshelf.
          </p>
        </section>

        <section className="pt-8 border-t border-[#E5E0D8]">
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Spotted a bug or still have questions?
          </h2>
          <p className="mb-6">
            If something isn&apos;t working right, if anything is still unclear, if you have suggestions, or if you simply want to chat about what you&apos;re currently reading, my inbox is always open.
          </p>

          <p className="font-serif italic text-[#5C613E] mb-8">
            Enjoy 🌿
          </p>

          <div className="flex flex-col gap-0.5">
            <p className="font-sans text-sm font-bold text-[#424B2E]">
              / Steven
            </p>
            <p className="font-sans text-sm font-bold text-[#424B2E]">
              steven.lennartsson@gmail.com
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-[#E5E0D8]/40">
            <p className="font-serif text-sm italic text-[#5C613E]/80">
              Curious about how this garden grows?{' '}
              <a
                href='https://github.com/stevenlomon/florilegium'
                target="_blank"
                rel="noopener noreferrer"
                className="not-italic font-sans text-[10px] font-bold tracking-widest uppercase text-[#424B2E] hover:text-[#2C302E] underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-colors ml-1"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </section>

      </article>
    </div>
  )
};