'use client'

interface DeleteTrackModalProps {
  trackTitle: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteTrackModal({ trackTitle, isDeleting, onClose, onConfirm }: DeleteTrackModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-2xl flex flex-col p-8 relative animate-in zoom-in-95 duration-300 border border-[#E5E0D8]">
        
        <div className="text-center mb-8 mt-4">
          <h2 className="font-heading text-3xl text-[#2C302E] leading-tight mb-2">
            Dismantle track?
          </h2>
          <p className="font-serif text-[#5C613E] leading-relaxed px-2">
            You are about to permanently remove your <strong className="font-semibold text-[#424B2E]">{trackTitle}</strong> track.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8]">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#5C613E] font-sans text-sm font-medium hover:text-[#2C302E] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-[#8C3A3A] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-6 py-2.5 rounded hover:bg-[#6b2b2b] transition shadow-sm disabled:opacity-70 disabled:cursor-wait"
          >
            {isDeleting ? "Dismantling..." : "Dismantle Track"}
          </button>
        </div>
      </div>
    </div>
  )
};