// The shape of only the essntial core data we get from Gutenberg that makes the app functional and we store in our Book table
export interface Author {
  name: string;
}

export interface Book {
  id: number;
  title: string;
  authors: Author[];
  subjects: string[]; 
  summary: string;    
  cover_image: string;
}

// A type for the exact response shape from our Route Handler so the Navbar knows exactly what data structure to expect
export interface GutenbergSearchResponse {
  next: string | null;
  previous: string | null;
  results: Book[];
}