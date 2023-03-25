import { ReactElement } from "react";

interface SectionHeadingProps {
  title: string;
}

export const SectionHeading = ({
  title,
}: SectionHeadingProps): ReactElement<SectionHeadingProps, "div"> => {
  return (
    <div className="mb-6 md:mb-12 border-b-4 dark:border-white border-black">
      <h1 className="font-bold pb-4">{title}</h1>
    </div>
  );
};
