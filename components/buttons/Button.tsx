import { motion, useSpring, VariantLabels, Variants } from "framer-motion";
import { ReactElement, use, useEffect } from "react";

interface ButtonProps {
  href?: string;
  label: string;
  onClick?: () => void;
  className?: string;
  animate?: VariantLabels;
  variants?: Variants;
}

export const Button = ({
  href,
  label,
  onClick,
  className,
  animate,
  variants,
}: ButtonProps): ReactElement<ButtonProps, "a"> => {
  return (
    <motion.button
      className={`${className} cursor-pointer rounded-full bg-gray-200/70 px-6 py-3 text-center font-semibold text-black backdrop-blur-sm transition-colors duration-200 hover:bg-gray-300/70 dark:bg-neutral-700/70 dark:text-white dark:hover:bg-neutral-800/70`}
      animate={animate}
      variants={variants}
      onClick={onClick}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <a href={href} target="_blank">
        {label}
      </a>
    </motion.button>
  );
};
