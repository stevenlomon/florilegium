'use client' // The only user interactive section (for now) on the Profile page
// Here we'll implement the modal that pops up when adding a Horizon book which will require useState

export default function HorizonSection() {
  return (
    <section>
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-normal text-[#2C302E]">
            The Horizon
          </h2>
          <p className="text-[#5C613E] mt-1 font-serif">
            The dense masterpieces that we're building momentum towards. Capped strictly at five to ensure intent over accumulation.
          </p>
        </div>

        {/* Grid layout for the 5 slots. 
          On mobile: 2 columns. On tablet: 3 columns. On large screens: 5 columns.
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          
          {/* Mapping out 5 purely visual, empty slots for now */}
          {[1, 2, 3, 4, 5].map((slot) => (
            <div 
              key={slot}
              className="group relative flex flex-col items-center justify-center aspect-2/3 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/30 hover:bg-[#EFEBE1]/50 hover:border-[#5C613E]/40 transition-all cursor-pointer"
            >
              {/* The Plus Button */}
              <div className="w-10 h-10 flex items-center justify-center border border-[#E5E0D8] rounded bg-white text-[#5C613E] group-hover:text-[#2C302E] group-hover:border-[#5C613E] transition-colors mb-4 shadow-sm">
                <span className="text-xl font-light">+</span>
              </div>
              
              {/* The Labels */}
              <p className="text-xs font-serif text-[#5C613E]/70 italic mb-1 text-center px-2">
                Awaiting a masterpiece
              </p>
              <p className="text-[10px] font-sans font-semibold tracking-widest text-[#5C613E] uppercase mt-2">
                Slot {slot} of 5
              </p>
            </div>
          ))}

        </div>
      </section>
  )
}
