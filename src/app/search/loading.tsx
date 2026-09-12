export default function SearchLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      
      {/* Elegant, thin spinner in the Florilegium palette */}
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#E5E0D8] border-t-[#5C613E]"></div>
      
      {/* The pulsing text to create the Labor Illusion */}
      <p className="mt-8 text-lg font-serif italic text-[#5C613E] animate-pulse">
        Consulting the archives...
      </p>
      
    </div>
  )
};