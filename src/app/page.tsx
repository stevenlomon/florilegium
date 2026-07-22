import ReadingTracksSection from '@/components/home/ReadingTracksSection';
import { getReadingTracks } from '@/lib/db/tracks';

// This is now a Server Component that does Server Side fetching too! Implementing the same "server seeds the client" pattern that we 
// use for the Bookshelf page! Therefore it now needs to be async
export default async function HomePage() {
  // Fetch the initial data... (now destructuring our updated payload)
  const { metadata, assignments } = await getReadingTracks();

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      
      {/* The header is pure HTML, zero JavaScript shipped to the client */}
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E]">Your Reading Tracks</h1>
        <p className="text-[#5C613E] mt-2 font-serif text-lg">
          Focused immersion. One active book, one follow-up. 
        </p>
      </header>

      {/* The grid and its state as an imported interactive client component */}
      {/* ...and seed the client! Server fetches the initial data, the client makes it come to life! */}
      <ReadingTracksSection initialTrackMetadata={metadata} initialTracks={assignments} />

    </div>
  )
};