import { motion } from "framer-motion";
import React, { ReactElement, useState } from "react";
import { Link } from "react-scroll";

interface Props {
  label: string;
  to: string;
}

const NavbarItem = ({ label, to }: Props): ReactElement<Props> => {
  return (
    <Link
      to={to}
      smooth
      className="cursor-pointer rounded-full bg-zinc-950/70 px-6 py-3 text-center font-semibold backdrop-blur-sm transition-colors duration-200 hover:bg-zinc-800/70"
    >
      {label}
    </Link>
  );
};

export const Navbar = (): ReactElement<"nav"> => {
  // const pages = [
  //   { label: "Skills", to: "skills" },
  //   { label: "Experience", to: "experience" },
  //   { label: "Projects", to: "projects" },
  // ];
  const [open, setOpen] = useState(false);
  const [isLargeVariant, setIsLargeVariant] = useState(false);

  if (typeof window === "undefined") return <></>;

  const throttle = (callback: Function, delay: number) => {
    var wait = false;
    return function () {
      if (!wait) {
        callback();
        wait = true;
        setTimeout(function () {
          wait = false;
        }, delay);
      }
    };
  };

  window.addEventListener(
    "resize",
    throttle(() => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setOpen(false);
        setIsLargeVariant(true);
      } else {
        setIsLargeVariant(false);
      }
    }, 200)
  );

  const largerVariants = {
    open: {
      width: 632,
      height: 304,
      borderRadius: 60,
      boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)",
    },
    closed: {
      width: 200,
      height: 56,
      borderRadius: 60,
      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
    },
  };

  const variants = {
    open: {
      width: 316,
      height: 152,
      borderRadius: 60,
      boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)",
    },
    closed: {
      width: 150,
      height: 42,
      borderRadius: 60,
      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
    },
  };

  const spring = {
    type: "spring",
    stiffness: 200,
    damping: 20,
  };

  const isMedium = window.matchMedia("(min-width: 768px)").matches;

  return (
    <nav className="sticky top-4 z-10 flex h-0 justify-center">
      <motion.div
        variants={isLargeVariant ? largerVariants : variants}
        animate={open ? "open" : "closed"}
        transition={spring}
        onClick={() => setOpen(!open)}
        className="relative flex h-12 w-48 items-center justify-center bg-black p-3 backdrop-blur-sm"
      >
        {open && (
          <motion.h2
            initial={{
              opacity: 0,
              scale: 0,
              y: 100,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={spring}
            className="text-white"
          >
            Dynamic Island under construction 🚧
          </motion.h2>
        )}
      </motion.div>
    </nav>
  );
};
