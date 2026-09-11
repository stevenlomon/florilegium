export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <img
        src="/logo-no-text.png"
        alt=""
        className="w-24 h-24 animate-pulse opacity-60"
      />
      <p className="font-serif text-sm italic text-[#5C613E]/70 animate-pulse">
        Retrieving from the archives&hellip;
      </p>
    </div>
  )
};