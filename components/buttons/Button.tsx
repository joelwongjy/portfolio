import { ReactElement } from "react";

interface ButtonProps {
  href?: string;
  label: string;
}

export const Button = ({
  href,
  label,
}: ButtonProps): ReactElement<ButtonProps, "a"> => {
  return (
    <a href={href} target="_blank">
      <button className="w-full rounded-md border-x border-b-4 border-t border-slate-300 bg-black px-4 py-3 text-left font-semibold text-white transition-all duration-200 hover:border-indigo-500 hover:bg-white hover:text-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white">
        {label}
      </button>
    </a>
  );
};
