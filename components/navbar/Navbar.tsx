import React, { ReactElement } from "react";
import { NavbarItem } from "./NavbarItem";

export const Navbar = (): ReactElement<"nav"> => {
  return (
    <nav className="flex w-full items-center justify-between py-6 transition-all duration-500">
      <div className="select-none text-lg font-extrabold uppercase">
        Joel Wong.
      </div>
      <div className="hidden md:flex">
        <NavbarItem label="Skills" to="skills"></NavbarItem>
        <NavbarItem label="Experience" to="experience"></NavbarItem>
        <NavbarItem label="Projects" to="projects"></NavbarItem>
      </div>
    </nav>
  );
};
