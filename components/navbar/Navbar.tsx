import React, { ReactElement } from "react";
import { NavbarItem } from "./NavbarItem";

export const Navbar = (): ReactElement<"nav"> => {
  return (
    <nav className="flex w-full -translate-x-4 items-center py-6">
      <NavbarItem label="Skills" to="skills"></NavbarItem>
      <NavbarItem label="Experience" to="experience"></NavbarItem>
      <NavbarItem label="Projects" to="projects"></NavbarItem>
    </nav>
  );
};
