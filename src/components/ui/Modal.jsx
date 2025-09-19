import React from "react";
import Card from "./Card";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ title, children, onClose, footer }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-md"
        >
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h3 className="text-xl font-bold text-amber-700">{title}</h3>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-lg bg-white/60 border border-amber-200 hover:bg-white/80 active:scale-95"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {children}
            {footer && <div className="mt-6 flex justify-end">{footer}</div>}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
