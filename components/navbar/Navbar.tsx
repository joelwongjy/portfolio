import { motion } from "framer-motion";
import React, { ReactElement, useEffect, useState } from "react";
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

  useEffect(() => {
    setIsLargeVariant(window.matchMedia("(min-width: 768px)").matches);
  }, []);

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
      width: 612,
      height: 240,
      borderRadius: 44,
      boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)",
    },
    closed: {
      width: 245,
      height: 56,
      borderRadius: 44,
      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
    },
  };

  const variants = {
    open: {
      width: 408,
      height: 160,
      borderRadius: 44,
      boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)",
    },
    closed: {
      width: 163,
      height: 37,
      borderRadius: 44,
      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
    },
  };

  const spring = {
    type: "spring",
    stiffness: 300,
    damping: 25,
  };

  return (
    <nav className="sticky top-4 z-10 flex h-0 cursor-pointer justify-center">
      <motion.div
        variants={isLargeVariant ? largerVariants : variants}
        animate={open ? "open" : "closed"}
        transition={spring}
        onClick={() => setOpen(!open)}
        className="relative flex h-12 w-48 items-center bg-black px-3 backdrop-blur-sm md:px-4"
      >
        {open && (
          <motion.h2
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{ ...spring, delay: 0.1 }}
            className="flex h-full w-full items-center justify-center text-white"
          >
            Dynamic Island under construction 🚧
          </motion.h2>
        )}
        {!open && (
          <motion.p
            initial={{
              opacity: 1,
              scale: 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={spring}
            className="flex justify-start md:text-lg"
          >
            🚧
          </motion.p>
        )}
      </motion.div>
    </nav>
  );
};
