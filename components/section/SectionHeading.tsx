import { ReactElement } from "react";

interface SectionHeadingProps {
  title: string;
}

export const SectionHeading = ({
  title,
}: SectionHeadingProps): ReactElement<SectionHeadingProps, "div"> => {
  return (
    <div className="mb-6 md:mb-12 flex items-center">
      <h1 className="font-bold pr-8 text-3xl">{title}</h1>
      <div className="mt-2 border-b-2 dark:border-white border-black grow" />
    </div>
  );
};
