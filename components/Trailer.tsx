import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useDialogFocus } from "../hooks/useDialogFocus";

interface TrailerProps {
  trailer_key: string;
  handleClose: () => void;
}

function Trailer({ trailer_key, handleClose }: TrailerProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Trailer"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${trailer_key}?autoplay=1&rel=0`}
          title="Trailer"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close trailer"
          className="absolute right-3 top-3 rounded-full bg-black/60 p-2 hover:bg-black/80"
        >
          <FiX size={20} />
        </button>
      </motion.div>
    </motion.div>
  );
}

export default Trailer;
