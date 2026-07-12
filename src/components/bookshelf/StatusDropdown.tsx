'use client'
import { useState } from 'react';

interface StatusDropdownProps {
  currentStatusId: number;
  onStatusChange: (newStatus: number) => Promise<void>;
}

export default function StatusDropdown({ currentStatusId, onStatusChange }: StatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatusId = Number(e.target.value);
    if (newStatusId === currentStatusId) return;

    setIsUpdating(true);
    await onStatusChange(newStatusId);
    setIsUpdating(false);
  };

  return (
    <div className={`relative inline-block transition-opacity ${isUpdating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <select 
        value={currentStatusId}
        onChange={handleChange}
        className="appearance-none bg-[#EFEBE1]/30 border border-[#E5E0D8] rounded-md pl-4 pr-10 py-2 text-xs font-sans font-medium text-[#5C613E] cursor-pointer hover:bg-[#EFEBE1]/80 transition-colors outline-none focus:border-[#5C613E] focus:ring-1 focus:ring-[#5C613E]"
      >
        <option value={1}>Intend to Read</option>
        {/* <option value={2}>Currently Reading</option> We do not allow the user to set the status of a book to Currently Reading from their Bookshelf! Only from the Reading Tracks!  */}
        <option value={3}>Read</option>
        <option value={4}>Dropped</option>
      </select>
      
      {/* Custom Dropdown Chevron */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5C613E]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}