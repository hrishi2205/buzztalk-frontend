import React from "react";
import Card from "./Card";
import Button from "./Button";

const Modal = ({ title, children, onClose, footer }) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-xl font-bold text-amber-700">{title}</h3>
          )}
          <Button variant="secondary" className="px-3 py-1" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end">{footer}</div>}
      </Card>
    </div>
  );
};

export default Modal;
