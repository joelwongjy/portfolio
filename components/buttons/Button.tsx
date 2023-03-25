import { ReactElement } from "react";

interface ButtonProps {
  label: string;
}

export const Button = ({
  label,
}: ButtonProps): ReactElement<ButtonProps, "button"> => {
  return (
    <button className="bg-black border-slate-300 hover:border-indigo-500 border-t border-x border-b-4 dark:bg-white px-4 py-3 text-left font-semibold text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white rounded-md w-full">
      {label}
    </button>
  );
};
