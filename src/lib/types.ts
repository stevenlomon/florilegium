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
}

// A type for the exact response shape from our Route Handler so the Navbar knows exactly what data structure to expect
export interface OpenLibrarySearchResponse {
  next: string | null;
  previous: string | null;
  results: Book[];
}