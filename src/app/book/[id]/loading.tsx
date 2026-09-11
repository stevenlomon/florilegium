export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <img
        src="/logo-no-text.png"
        alt=""
        className="w-48 h-48 animate-pulse opacity-60"
      />
      <p className="font-serif text-sm italic text-[#5C613E]/70 animate-pulse">
        Retrieving from the archives&hellip;
      </p>
    </div>
  )
};