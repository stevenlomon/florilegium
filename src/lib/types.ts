// The shape of only the essntial core data we get from Open Library that makes the app functional and we store in our Book table
export interface Author {
  name: string;
}

// NEW: The shape of a specific Edition
export interface Edition {
  id: string;
  title: string;
  cover_image_url: string | null;
  page_count: number | null;
  publish_date?: string | null;
  isbn?: string | null; // For the Edition Switcher modal
}

export interface Book {
  id: string; // Gutenberg used number but in switching to Open Library, we're back to string haha!
  title: string;
  authors: Author[];
  subjects: string[];
  summary: string;
  cover_image: string;
  page_count: number | null; // Data won't always be available but the key will. `number` or `null`
  default_edition_id?: string | null; // Won't always be available, not even the key. `string`, `null` or `undefined`
  editions?: Edition[]; // The array of specific editions we map out
  isbn?: string | null; // ISBN is now brought to the Work level too for the default edition
}

export interface TrackBook {
  track_id: number; // Now number instead of string, see comment at the TRACKS array
  slot_id: number;
  book_id: string;
  bookshelf_item_id: string; // Needed for the onHover enlarging and the Celebration modal
  external_id: string | null;
  title: string;
  author: string;
  cover_image_url: string | null;
  custom_page_count?: number | null; // The new user entered custom page count!
  page_count?: number | null; // The API ballpark fallback
  current_page?: number | null; // From the Reading_Journey table
}

export interface BookshelfItem {
  bookshelf_item_id: string;
  status_id: number;
  user_rating: number | null;
  book_id: number; // It's an integer in our Postgres db!
  external_id: string | null;
  title: string;
  author: string;
  cover_image_url: string | null;
  horizon_slot: number | null;
  page_count: number | null;
  recommendation_context: Recommendation[];
  review: string | null;
  journeys: ReadingJourney[];
}

export interface Recommendation {
  id: string;
  bookshelf_item_id: string;
  recommended_by: string;
  link?: string | null;
  notes?: string | null;
}

export interface ReadingJourney {
  id: string;
  started_at: string;
  finished_at: string | null;
  current_page: number;
  iteration: number;
  notes?: string | null; // Optional: represents the raw thoughts captured upon finishing a book for now
}