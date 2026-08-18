import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  hoverable = false,
  className = "",
  onClick,
}: CardProps) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverProps = hoverable && !reduced
    ? {
        whileHover: { scale: 1.03, y: -4 },
        whileTap: { scale: 0.98 },
        transition: { type: "spring" as const, stiffness: 350, damping: 20 },
      }
    : {};

  return (
    <motion.div
      {...hoverProps}
      onClick={onClick}
      className={`
        bg-white/80 backdrop-blur-sm
        rounded-3xl shadow-lg shadow-soil-brown/10
        border border-white/60
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
