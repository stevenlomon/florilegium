'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type TrackBook } from '@/lib/types';
import ReadingTrackCard from './ReadingTrackCard';
import ReadingTracksModal from './ReadingTracksModal';
import CelebrationModal from './CelebrationModal';
import CrossroadsModal from './CrossroadsModal';
import DeleteTrackModal from './DeleteTrackModal';

interface ReadingTracksSectionProps {
  initialTrackMetadata: { id: number, title: string, description: string }[];
  initialTracks: TrackBook[];
}

// The TRACKS array used to have id: 'fiction', id: 'non-fiction' and id: 'before-bedtime' which makes sense if the Reading Tracks were to be
// hard set in stone but they won't! The user will be able to change the name and description to their heart's content to fit their life. So
// we're changing these to be integers to align with the database. `number` across the board
// The names and descriptions stay the same tho as the default when the user first starts to use the app! The user will alse be able to remove 
// Reading Tracks down to 2 or 1 but they won't ever be able to have more than 3 at any given time! This is by conscious intentional design 🌿 
// If a user is frustrated with this design choice, they'll know where to mail me haha! 

// This default array of Reading Tracks now lives in app/api/users/route.ts where we create users!
// const TRACKS = [
//   { id: 1, title: 'Fiction', description: 'Immersive narratives and alternate realities.' },
//   { id: 2, title: 'Non-fiction', description: 'Expanding models of reality and actionable knowledge.' },
//   { id: 3, title: 'Before Bedtime', description: 'Wind-down reading. Low stakes, high comfort.' } // Changed from 'bedtime' to 'before-bedtime' for coherence and ease in db queries
// ];

// This now takes initialTracks as a prop as the intial data from the server! This client component is now not responsible at all for 
// *fetching* data, only making it come to life and become interactive!
export default function ReadingTracksSection({ initialTrackMetadata, initialTracks }: ReadingTracksSectionProps) {
  // In the Horizon Book section, we had a single 5-column row. Now we have a two-dimensional grid; the track and the slot. trackId comes from 
  // TRACKS, "Currently Reading" has slotId 1 and "Follow-up" has slotId 2. It starts as null meaning if it's null, the modal is closed. The 
  // alternative would be three or six separate states which sounds like an absolute nightmare to maintain. A single active modal context allows
  // us to render exactly one ReadingTrackModal at the bottom of the page! activeModalContext it is haha!
  const trackBooks = initialTracks; // No longer starts as an empty array; it starts as what the server has fetched and provided! Also; doesn't need to be a state variable thanks to server seeding + router.refresh()!
  const [activeModalContext, setActiveModalContext] = useState<{ trackId: number, slotId: number, trackTitle: string } | null>(null); // Updated to include the title cased track title to make it easier in the modal

  // Celebration modal state variables
  const [isFinishingId, setIsFinishingId] = useState<string | null>(null);
  const [celebrationPayload, setCelebrationPayload] = useState<{ bookTitle: string, promotion: { promotedBook: string | null; trackName: string; finishedJourneyId: string } } | null>(null);
  const [crossroadsPayload, setCrossroadsPayload] = useState<{ trackId: number, bookTitle: string } | null>(null);

  // Inline editing state variables
  const [localTracks, setLocalTracks] = useState(initialTrackMetadata); // Elevating TRACKS to state so we can mutate it locally!
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingTrack, setIsSavingTrack] = useState(false);

  // Track deletion state variables
  const [trackToDelete, setTrackToDelete] = useState<{ id: number, title: string } | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);

  // Track creation state variables
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackDescription, setNewTrackDescription] = useState("");
  const [isSavingNewTrack, setIsSavingNewTrack] = useState(false);

  const router = useRouter(); // For router.refresh()

  // No more fetchReadingTracks!
  // When router.refresh() happens, the server sends down new props. This effect catches them and updates the UI instantly.
  // This useEffect is essentially the core of the entire Full Stack machinery: 
  // Server loads initial data -> Client holds said data in Browser memory (useState) -> user interacts and triggers a background
  // mutation -> router.refresh() asks the server for the data; the new single source of truth -> this useEffect patches this new 
  // data into the client state without a full page reload
  // useEffect(() => {
  //   setTrackBooks(initialTracks);
  // }, [initialTracks]); Since trackBooks is no longer a state variable, this useEffect is no longer needed!

  // And this is our new refresh function! No more fetch('/api/tracks') needed!
  const refreshReadingTracks = () => {
    console.log("Asking server for fresh data...");
    router.refresh();
  };
  // The rest of the file stays exactly the same! Completely untouched.
  // It's... it's all so simple yet incredibly elegant. And it just makes intuitive sense! I can never Step back from using Next.js now haha!

  const handleFinishBook = async (e: React.MouseEvent, bookshelfItemId: string, bookTitle: string) => {
    e.preventDefault();
    e.stopPropagation(); // Completely new to me, first time seeing! It's used here to prevent Event Bubbling and any unwanted side effects from the click. The click is contained strictly to the "Finish" button so that we can be in control when we show the modal

    if (isFinishingId) return; // To prevent double clicks
    setIsFinishingId(bookshelfItemId);

    try {
      const res = await fetch('/api/bookshelf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: bookshelfItemId,
          status_id: 3 // 3 = "Read" which will trigger the Librarian Transaction!
        })
      });

      if (!res.ok) throw new Error("Failed to finish book");

      const data = await res.json();

      if (data.promotion) {
        // Intercept the payload!! In order to show our new modal
        setCelebrationPayload({ bookTitle, promotion: data.promotion }); // Now includes the finishedJourneyId we've added
      } else {
        // Fallback just in case
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to finish book. Please try again.");
    } finally {
      setIsFinishingId(null);
    }
  };

  const handleCloseCelebration = () => {
    setCelebrationPayload(null);
    refreshReadingTracks(); // Needed to refresh the UI client-side! (useState)
    router.refresh();       // This refreshes the UI server-side (the entire Server Component(s))
  };

  // Helper to snap into edit mode and pre-fill the inputs
  const startEditing = (trackId: number, currentTitle: string, currentDescription: string) => {
    setEditingTrackId(trackId);
    setEditTitle(currentTitle);
    setEditDescription(currentDescription);
  };

  const handleSaveTrack = async (trackId: number) => {
    if (!editTitle.trim()) return; // Prevent saving empty names

    setIsSavingTrack(true);
    try {
      const res = await fetch('/api/tracks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: trackId,
          name: editTitle.trim(),
          description: editDescription.trim()
        })
      });

      if (!res.ok) throw new Error("Failed to update track");

      // Optimistically update the UI without a full reload. We trust the data is saved, so we immediately update our local React state 
      // to make the app feel alive, fast and tactile!
      setLocalTracks(prevTracks =>
        prevTracks.map(t =>
          t.id === trackId
            ? { ...t, title: editTitle.trim(), description: editDescription.trim() }
            : t
        )
      );

      setEditingTrackId(null);
      router.refresh(); // Now uncommented since we actually fetch the name and description from the database!
    } catch (err) {
      console.error(err);
      alert("Failed to save track updates. Please try again.");
    } finally {
      setIsSavingTrack(false);
    }
  };

  const handleDeleteTrack = async () => {
    if (!trackToDelete) return;
    setIsDeletingTrack(true);

    try {
      const res = await fetch('/api/tracks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: trackToDelete.id })
      });

      if (!res.ok) throw new Error("Failed to delete track");

      // Optimistically remove it from the UI
      setLocalTracks(prev => prev.filter(t => t.id !== trackToDelete.id));
      setEditingTrackId(null);
      setTrackToDelete(null);

      // Ensure the server state matches in case there were orphaned UI elements
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete track. Please try again.");
    } finally {
      setIsDeletingTrack(false);
    }
  };

  const handleCreateTrack = async () => {
    if (!newTrackTitle.trim()) return;
    setIsSavingNewTrack(true);
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTrackTitle.trim(), description: newTrackDescription.trim() })
      });
      if (!res.ok) throw new Error("Failed to create track");

      const data = await res.json();
      setLocalTracks(prev => [...prev, data.data]);
      setIsAddingTrack(false);
      setNewTrackTitle("");
      setNewTrackDescription("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to create track. Please try again.");
    } finally {
      setIsSavingNewTrack(false);
    }
  };

  return (
    // The outer flex container ensures the entire track block stays perfectly centered on the page
    <div className="flex justify-center w-full">

      {/* The inner container naturally shrinks to fit 1, 2, or 3 tracks */}
      <div className="relative flex flex-col xl:flex-row w-full xl:w-fit justify-center divide-y xl:divide-y-0 xl:divide-x divide-[#E5E0D8]">

        {/* Render the Active Tracks: We map over localTracks now! */}
        {localTracks.map((track) => (
          // `w-[25rem]` explicitly locks the geometry to prevent flexbox auto-squishing
          <section key={track.id} className="w-full xl:w-[28rem] shrink-0 py-8 xl:py-0 px-4 xl:px-6 flex flex-col">

            {/* `min-h-25` guarantees the grids align perfectly regardless of description length */}
            <div className="mb-6 min-h-25 group relative">
              {editingTrackId === track.id ? (
                // EDIT MODE
                <div className="flex flex-col gap-2 animate-in fade-in duration-200 pr-8">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    // Removed border-b, added a subtle rounded background for edit mode
                    className="w-full text-2xl font-heading text-[#2C302E] bg-[#EFEBE1]/50 rounded px-2 py-1 outline-none focus:bg-white transition-colors"
                    autoFocus
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    // Removed border-b, added matching rounded background
                    className="w-full text-[#5C613E] font-serif italic text-sm leading-snug bg-[#EFEBE1]/50 rounded px-2 py-1.5 outline-none resize-none focus:bg-white transition-colors"
                    rows={2}
                  />
                  <div className="flex items-start justify-between mt-1 px-2">
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => handleSaveTrack(track.id)}
                        disabled={isSavingTrack || !editTitle.trim()}
                        className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#424B2E] hover:text-[#2C302E] transition-colors disabled:opacity-50"
                      >
                        {isSavingTrack ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingTrackId(null)}
                        disabled={isSavingTrack}
                        className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#5C613E]/70 hover:text-[#5C613E] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* The Delete Button Area */}
                    {localTracks.length > 1 && (() => {
                      // Check if this specific track has any books assigned to it
                      const hasBooks = trackBooks.some(b => b.track_id === track.id);

                      return (
                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => setTrackToDelete({ id: track.id, title: track.title })}
                            disabled={hasBooks}
                            className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#8C3A3A]/70 hover:text-[#8C3A3A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed pt-1"
                            title={hasBooks ? "Clear this track before deleting" : "Dismantle Track"}
                          >
                            Dismantle Track
                          </button>
                          {hasBooks && (
                            <span className="text-[9px] font-serif italic text-[#8C3A3A]/60 mt-0.5 pr-0.5">
                              *Unassign books to delete
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <div className="pr-8 relative">
                  <h2 className="text-2xl font-heading text-[#2C302E]">{track.title}</h2>
                  <p className="text-[#5C613E] font-serif italic text-sm mt-1 leading-snug">{track.description}</p>

                  {/* The Hover Pen Icon */}
                  <button
                    onClick={() => startEditing(track.id, track.title, track.description)}
                    className="absolute top-1 -right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#5C613E]/50 hover:text-[#424B2E]"
                    title="Edit Track"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Track Grid: Exactly 2 slots (Currently Reading + Up Next) */}
            <div className="grid grid-cols-2 gap-6 flex-1">
              {[1, 2].map((slot) => {
                const assignedBook = trackBooks.find(b => b.track_id === track.id && b.slot_id === slot);
                const slotLabel = slot === 1 ? "Currently Reading" : "Up Next";

                if (assignedBook) {
                  // SCENARIO A: THE SLOT IS FILLED
                  // Now has a fully dedicated client component for the Reading Track card with the new current_page input feature 
                  // being implemented. We make this into its own dedicated component but *not* the Assignment button in Scenario B.
                  // Yes, we *could* make that its own component and even try to make it so that it could live both here and in the
                  // Horizon section. But.. just because you *can* do something doesn't mean that you *should* and that it serves
                  // you to. 
                  // Here it doesn't serve us; the need isn't there and it would slow down MVP momentum. *Just in time, not just in case*
                  const isCurrentlyReading = slot === 1;

                  return (
                    <div key={`${track.id}-${slot}`} className="flex flex-col gap-3 relative">

                      {/* The new, self-contained component. `e` is type inferred as `MouseEvent<Element, MouseEvent>`! */}
                      <ReadingTrackCard
                        book={assignedBook}
                        isCurrentlyReading={isCurrentlyReading}
                        onFinishBook={(e) => handleFinishBook(e, assignedBook.bookshelf_item_id, assignedBook.title)}
                        onShelveBook={(e) => { //onFinishBook and onShelveBook differ in the sense that shelving doesn't immediately talk to the database. It simply delegates the database transaction to the modal rather than firing immediately. Until later when we introduce the default behavior in User Settings!
                          e.preventDefault();
                          e.stopPropagation(); // onFisnishBook also uses `e.stopPropagation();` but it lives in `handleFinishBook`!
                          setCrossroadsPayload({ trackId: track.id, bookTitle: assignedBook.title });
                        }}
                        isFinishing={isFinishingId === assignedBook.bookshelf_item_id}
                      />

                      <p className="text-[9px] font-sans font-bold tracking-widest text-[#5C613E] uppercase text-center relative z-10">
                        {slotLabel}
                      </p>
                    </div>
                  );
                }

                // SCENARIO B: THE SLOT IS EMPTY
                return (
                  <button
                    key={`${track.id}-${slot}`}
                    type='button'
                    className="group relative flex flex-col items-center justify-center aspect-2/3 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/30 hover:bg-[#EFEBE1]/50 hover:border-[#5C613E]/40 transition-all cursor-pointer w-full"
                    onClick={() => setActiveModalContext({ trackId: track.id, slotId: slot, trackTitle: track.title })}
                  >
                    <div className="w-8 h-8 flex items-center justify-center border border-[#E5E0D8] rounded bg-white text-[#5C613E] group-hover:text-[#2C302E] group-hover:border-[#5C613E] transition-colors mb-3 shadow-sm">
                      <span className="text-lg font-light">+</span>
                    </div>
                    <p className="text-[11px] font-serif text-[#5C613E]/70 italic mb-1 text-center px-1">
                      Assign book
                    </p>
                    <p className="text-[9px] font-sans font-semibold tracking-widest text-[#5C613E] uppercase mt-2">
                      {slotLabel}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {/* ADD TRACK FORM: Snaps into flow when triggered */}
        {localTracks.length < 3 && (
          isAddingTrack ? (
            // FORM VIEW: Rendered IN FLOW so it physically takes up space and completes the grid
            <section className="w-full xl:w-[28rem] py-8 xl:py-0 px-4 xl:px-6 border-t xl:border-t-0 xl:border-l border-[#E5E0D8] flex flex-col">
              <div className="mb-8 min-h-24 group relative">
                <div className="flex flex-col gap-2 animate-in fade-in duration-200 pr-8">
                  <input
                    type="text"
                    placeholder="Track Title..."
                    value={newTrackTitle}
                    onChange={(e) => setNewTrackTitle(e.target.value)}
                    className="w-full text-2xl font-heading text-[#2C302E] bg-[#EFEBE1]/50 rounded px-2 py-1 outline-none focus:bg-white transition-colors"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTrackDescription}
                    onChange={(e) => setNewTrackDescription(e.target.value)}
                    className="w-full text-[#5C613E] font-serif italic text-sm leading-snug bg-[#EFEBE1]/50 rounded px-2 py-1.5 outline-none resize-none focus:bg-white transition-colors"
                    rows={2}
                  />
                  <div className="flex items-start justify-between mt-1 px-2">
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleCreateTrack}
                        disabled={isSavingNewTrack || !newTrackTitle.trim()}
                        className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#424B2E] hover:text-[#2C302E] transition-colors disabled:opacity-50"
                      >
                        {isSavingNewTrack ? 'Creating...' : 'Create Track'}
                      </button>
                      <button
                        onClick={() => { setIsAddingTrack(false); setNewTrackTitle(""); setNewTrackDescription(""); }}
                        disabled={isSavingNewTrack}
                        className="font-sans text-[10px] font-bold tracking-widest uppercase text-[#5C613E]/70 hover:text-[#5C613E] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dummy slots to exactly mirror the body shape of a Reading Track */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="aspect-2/3 border-2 border-dashed border-[#E5E0D8] rounded-md bg-transparent"></div>
                <div className="aspect-2/3 border-2 border-dashed border-[#E5E0D8] rounded-md bg-transparent"></div>
              </div>
            </section>
          ) : (
            <>
              {/* DESKTOP GHOST TRACK: Absolute positioned hover zone so it doesn't affect active track centering! */}
              <div className="hidden xl:flex absolute left-full top-0 h-full w-[28rem] flex-col opacity-20 hover:opacity-100 transition-opacity">
                {/* Matches padding of the active tracks and adds the visual border */}
                <div className="w-full h-full border-l border-[#E5E0D8] pl-8 flex flex-col">
                  {/* The button spans the entire height; we don't lie about the shape of a Reading Track! */}
                  <button
                    type="button"
                    onClick={() => setIsAddingTrack(true)}
                    className="group relative flex flex-col items-center justify-center flex-1 border-2 border-dashed border-[#E5E0D8] rounded-md bg-transparent hover:bg-[#EFEBE1]/50 hover:border-[#5C613E]/40 transition-all cursor-pointer w-full"
                  >
                    <div className="w-10 h-10 flex items-center justify-center border border-[#E5E0D8] rounded-full bg-white text-[#5C613E] group-hover:text-[#2C302E] group-hover:border-[#5C613E] transition-colors mb-4 shadow-sm">
                      <span className="text-2xl font-light">+</span>
                    </div>
                    <h2 className="text-xl font-heading text-[#2C302E] mb-1">Add Track</h2>
                    <p className="text-xs font-serif text-[#5C613E]/70 italic text-center px-4">
                      Expand your garden
                    </p>
                  </button>
                </div>
              </div>

              {/* MOBILE ADD TRACK BUTTON: In-flow because mobile doesn't have hover states */}
              <section className="xl:hidden w-full py-8 px-4 flex flex-col border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setIsAddingTrack(true)}
                  className="group relative flex flex-col items-center justify-center flex-1 border-2 border-dashed border-[#E5E0D8] rounded-md bg-transparent hover:bg-[#EFEBE1]/50 hover:border-[#5C613E]/40 transition-all cursor-pointer w-full min-h-62.5"
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-[#E5E0D8] rounded-full bg-white text-[#5C613E] mb-4 shadow-sm">
                    <span className="text-2xl font-light">+</span>
                  </div>
                  <h2 className="text-xl font-heading text-[#2C302E]">Add Track</h2>
                </button>
              </section>
            </>
          )
        )}

      </div>

      {/* ALL MODALS (Safely extracted outside the map loop) */}
      < ReadingTracksModal
        isOpen={activeModalContext !== null} // Only open if activeModalContext is a valid object
        onClose={() => setActiveModalContext(null)}
        targetSlot={activeModalContext}
        onSuccess={refreshReadingTracks}
      />

      {celebrationPayload && (
        <CelebrationModal
          bookTitle={celebrationPayload.bookTitle}
          promotion={celebrationPayload.promotion}
          onClose={handleCloseCelebration}
        />
      )}

      {crossroadsPayload && (
        <CrossroadsModal
          bookTitle={crossroadsPayload.bookTitle}
          trackId={crossroadsPayload.trackId}
          onClose={() => setCrossroadsPayload(null)}
        />
      )}

      { /* And our new Delete Track Modal. Most likely the last haha! */}
      {trackToDelete && (
        <DeleteTrackModal
          trackTitle={trackToDelete.title}
          isDeleting={isDeletingTrack}
          onClose={() => setTrackToDelete(null)}
          onConfirm={handleDeleteTrack}
        />
      )}

    </div>
  )
};