import React, { ReactElement } from "react";
import { NavbarItem } from "./NavbarItem";

export const Navbar = (): ReactElement<"nav"> => {
  return (
    <nav className="flex w-full py-10 items-center justify-between transition-all duration-500">
      <a className="cursor-pointer select-none text-lg font-extrabold uppercase">
        Joel Wong.
      </a>
      <div className="flex gap-6">
        <NavbarItem label="Test" href=""></NavbarItem>
        <NavbarItem label="Test" href=""></NavbarItem>
        <NavbarItem label="Test" href=""></NavbarItem>
      </div>
    </nav>
  );
};
