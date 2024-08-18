import { motion } from "framer-motion";
import React, { ReactElement } from "react";
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
  const [open, setOpen] = React.useState(false);
  const variants = {
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
  const spring = {
    type: "spring",
    stiffness: 200,
    damping: 20,
  };

  return (
    <nav className="sticky top-4 z-10 flex h-0 justify-center">
      <motion.div
        variants={variants}
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
