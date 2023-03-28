import React, { ReactElement } from "react";
import { NavbarItem } from "./NavbarItem";

export const Navbar = (): ReactElement<"nav"> => {
  return (
    <nav className="flex w-full items-center justify-between py-6 transition-all duration-500">
      <a className="cursor-pointer select-none text-lg font-extrabold uppercase">
        Joel Wong.
      </a>
      <div className="flex gap-6">
        <NavbarItem label="Home" href=""></NavbarItem>
      </div>
    </nav>
  );
};
