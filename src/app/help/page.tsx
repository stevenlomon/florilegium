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
          Prioritizing signal over noise. Reclaiming reading as a quiet, unmediated sanctuary.
        </p>
      </header>

      <article className="max-w-3xl space-y-12 text-[#2C302E] font-serif leading-relaxed">

        {/* ETHOS / MANIFESTO SECTION */}
        <section className="bg-[#EFEBE1]/40 border border-[#E5E0D8] p-8 rounded-lg space-y-4">
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#424B2E]">
            The Core Ethos: Intentional, grounded, human. Signal Over Noise
          </h2>
          <p className="text-base leading-relaxed">
            Florilegium is a sanctuary designed, first and foremost, for myself to rekindle and cultivate my love for reading.
          </p>
          <p className="text-base leading-relaxed">
            My own personal problem with modern book tracking sites is that somewhere along the way we started valuing noise over signal. Before we have even read the first page our mind is poisoned by aggregated scores from thousands of strangers and the top-voted &quot;hot takes&quot; that generate cynical discourse and confirmation bias. It&apos;s cognitive pollution. It&apos;s all noise.
          </p>
          <p className="text-base leading-relaxed text-[#5C613E]">
            Florilegium is an invitation to get back to reading the way we did as children. An invitation to start prioritizing signal over noise.
          </p>
          <p className="text-base leading-relaxed text-[#5C613E]">
            In the cases where we weren&apos;t told what to read, the most magical and formative reading experiences were those grounded in resonance and curiosity. You finished a book a friend recommended and you can&apos;t stop thinking about it. You saw a book that simply spoke to you at Barnes & Noble and it kept you up at night.
          </p>
          <p className="text-base leading-relaxed">
            How does this translate to us now as adults in the Attention Economy age?
          </p>
          <p className="text-base leading-relaxed">
            One or two strong recommendations from Booktubers we resonate with. A recommendation from a friend we hold close to our heart. A book that genuinely draws you in and compels you at a second hand store or the local library. And a page estimate. I would argue that that&apos;s all we truly need to make a decision to read something.
          </p>
          <p className="text-base leading-relaxed text-[#5C613E]">
            And from there it&apos;s simply a question of discernment: <i>Do I commit to reading this now? After the book I&apos;m currently reading? Or sometime shortly thereafter?</i>
          </p>
          <p className="text-base leading-relaxed text-[#5C613E]">
            All while also having a clear sense of where our reading journey is headed. The dense masterpieces we want to cultivate momentum towards. Our reading life&apos;s North Star.
          </p>
          <p className="text-base leading-relaxed">
            Built with love and care.<br />
            /Steven 🌿
          </p>
        </section>

        {/* THE HORIZON */}
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

        {/* THE BOOKSHELF */}
        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            The Bookshelf
          </h2>
          <p className="mb-4">
            Your Bookshelf is your master archive. Every work you add lands here first. From here, you can preserve recommendation contexts (who recommended the book to you and why), log retroactive reading journeys, rate works, and write polished reviews.
          </p>
          <p className="text-[#5C613E] italic text-sm">
            Note: Active reading is managed exclusively in your Reading Tracks to preserve single-minded focus.
          </p>
        </section>

        {/* READING TRACKS */}
        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Reading Tracks
          </h2>
          <p className="mb-4">
            Your active workbench. To prevent the cognitive overwhelm of reading too many works at once, you are limited to three dedicated tracks (e.g., <i>Fiction</i>, <i>Non-fiction</i>, <i>Before Bedtime</i>).
          </p>
          <p className="mb-4">
            But they are moldable to your life and your heart&apos;s desire. Change their name and description and if you know you prefer to read only one book at a time, keep only one track.
          </p>
          <p className="mb-4">
            Each track holds exactly two slots:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#5C613E]">
            <li><strong className="font-semibold text-[#2C302E]">Currently Reading:</strong> The single work you are actively engaged with right now in this track.</li>
            <li><strong className="font-semibold text-[#2C302E]">Up Next:</strong> The designated follow-up. When you finish your active read, this follow-up is automatically promoted into your active slot, keeping your momentum uninterrupted.</li>
          </ul>
        </section>

        {/* READING JOURNEYS & RAW THOUGHTS */}
        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Reading Journeys & Raw Thoughts
          </h2>
          <p className="mb-4">
            Books exist in context with where you are in life. Every time you read a work, a distinct <i>Reading Journey</i> is recorded. You can re-read a cherished book years later, preserving each read-through on a personal timeline.
          </p>
          <p>
            When you turn the last page, Florilegium prompts you to capture your <i>raw thoughts</i>—the immediate, unpolished feelings you have upon turning the last page, completely separate from your overarching polished review.
          </p>
        </section>

        {/* FOOTER / CONTACT */}
        <section className="pt-8 border-t border-[#E5E0D8]">
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4">
            Spotted a bug or still have questions?
          </h2>
          <p className="mb-6">
            If something isn&apos;t working right, if you have suggestions, or if you simply want to chat about what book you&apos;re currently reading, my inbox is always open.
          </p>

          <div className="flex flex-col gap-0.5">
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