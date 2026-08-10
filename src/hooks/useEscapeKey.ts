import { useEffect } from 'react';

// To be imported into all Modal Components to enable closing them with the Esc key!
export function useEscapeKey(onClose: () => void, isOpen: boolean = true) {
  useEffect(() => {
    // If the modal isn't open, we don't even bother listening
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add the event listener to the document
    document.addEventListener('keydown', handleKeyDown);

    // Clean up the listener when the modal closes or unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isOpen]);
};