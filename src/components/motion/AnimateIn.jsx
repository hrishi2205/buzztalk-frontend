import React from "react";
import { motion } from "framer-motion";

const variants = {
  up: { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } },
  down: { hidden: { y: -20, opacity: 0 }, show: { y: 0, opacity: 1 } },
  left: { hidden: { x: 20, opacity: 0 }, show: { x: 0, opacity: 1 } },
  right: { hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  scale: {
    hidden: { scale: 0.96, opacity: 0 },
    show: { scale: 1, opacity: 1 },
  },
};

const AnimateIn = ({
  as = motion.div,
  children,
  type = "up",
  delay = 0,
  duration = 0.4,
  className,
  style,
  ...rest
}) => {
  const Comp = as;
  const v = variants[type] || variants.up;
  return (
    <Comp
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={v}
      transition={{ duration, ease: [0.2, 0.8, 0.2, 1], delay }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export default AnimateIn;
