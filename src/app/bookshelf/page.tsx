import BookshelfClient from '@/components/bookshelf/BookshelfClient';
import { getDetailedBookshelf } from '@/lib/db/bookshelf';

export default async function BookshelfPage() {
  // Since this is a server component, we can do this! Use what the brain consider's "Backend functions"... in a Frontend component haha!
  // This is truly where Next.js shines and shows that *there is no "backend" and no "frontend"; only full-stack!!
  // I will dive back into *why* we use the GET Route Handlers for the Horizon and Reading Tracks sections and this way here in a day or
  // two cuz right now it feels like my brain is about to implode and I wanna keep the flow momentum going hahaha

  // I wrote the comment above two days ago according to GitHub. We're tackling this overwhelm now that an SQL query has topped it in 
  // the amount of overwhelm it gives haha! The core of what brought me overwhelm was 1. seeing a component, which my brain connects to
  // Vite + React and Frontend, talk directly to our database. As this file stands right now, it still talks to the database, it very much 
  // does! But *HOW* it talks to the database is abstracted away and can be seen for anyone who wants to get a peek into the black box in 
  // /lib/db/bookshelf.ts!
  // 2. *Why* server side fetching here for this page but client side fetching for the Horizon and the Reading Routes? 
  // The easy answer is that I didn't know about server side fetching when writing them haha! But now that I do, let's compare and contrast,
  // and let's solidify a new deicion I've made to transform the Horizon section into a server component but not the Reading Tracks section.
  // Full client side fetching is perfect for pages that are highly interactive. Which the Reading Tracks page is! It's the user's "active
  // workbench". They are assigning and re-assigning books in several tracks, updating page counts, interacting with a two-step modal etc. etc.
  // But the Horizon page! This one is *designed* to be static! To rarely be interacted with! A slot might be filled for a year! But once it 
  // becomes empty and the user gets to assign a new Horizon book.. it's an event.

  // And actually, just now... if the thought of Server Side fetching and seeing it for the first time made me write this "cuz right now it feels 
  // like my brain is about to implode", reading about Seeding Client State with Server Data just actually made my brain implode. My entire 
  // body is tingling haha! We fetch the *initial* data directly on the server and hand it over to the client that makes it interactive and 
  // optimizes the environment to react and re-render in real time in response to said user interaction.
  // It's the very pattern used in the code below!!
  // We fetch intialBooks on the server and then hands it to the BookshelfClient client component! Where it becomes alive data, ready for the 
  // user to interact with. This same "server seeding the client state" pattern will be implemented for the Reading Routes UI too! While the 
  // Horizon will be purely server side!
  const initialBooks = await getDetailedBookshelf();

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">Your Bookshelf</h1>
        <p className="text-[#5C613E] font-serif italic text-lg">
          Your personal library and reading history.
        </p>
      </header>

      {/* Pass the server-fetched data straight into our interactive client component */}
      <BookshelfClient initialBooks={initialBooks} />
    </div>
  );
}