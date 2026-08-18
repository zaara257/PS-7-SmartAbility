import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "transition"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-forest-green text-white hover:bg-leaf-green shadow-md shadow-forest-green/30",
  secondary:
    "bg-sunshine-yellow text-bark-brown hover:bg-yellow-300 shadow-md shadow-sunshine-yellow/40",
  ghost:
    "bg-white/60 text-forest-green border-2 border-forest-green/30 hover:bg-forest-green/10",
  danger:
    "bg-flower-pink text-white hover:bg-pink-400 shadow-md shadow-flower-pink/30",
};

const sizeClasses: Record<string, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

// Respect prefers-reduced-motion
const motionProps = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 400, damping: 17 },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      {...(window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? {}
        : motionProps)}
      disabled={disabled}
      className={`
        font-fredoka font-semibold rounded-full
        transition-colors duration-200
        focus:outline-none focus:ring-4 focus:ring-forest-green/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
