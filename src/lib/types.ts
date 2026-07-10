// The shape of only the essntial core data we get from Open Library that makes the app functional and we store in our Book table
export interface Author {
  name: string;
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
}

// A type for the exact response shape from our Route Handler so the Navbar knows exactly what data structure to expect
export interface OpenLibrarySearchResponse {
  next: string | null;
  previous: string | null;
  results: Book[];
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
}