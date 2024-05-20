import { ReactElement } from "react";
import { Link } from "react-scroll";

interface Props {
  label: string;
  to: string;
}

export const NavbarItem = ({ label, to }: Props): ReactElement<Props> => {
  return (
    <Link
      to={to}
      smooth
      className="cursor-pointer rounded-lg px-8 py-4 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {label}
    </Link>
  );
};
