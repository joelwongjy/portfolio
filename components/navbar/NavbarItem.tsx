import { ReactElement } from "react";

interface Props {
  label: string;
  href: string;
}

export const NavbarItem = ({ label, href }: Props): ReactElement<Props> => {
  return (
    <a
      href={href}
      className="cursor-pointer rounded-lg px-8 py-4 hover:bg-gray-100 font-semibold"
    >
      {label}
    </a>
  );
};
