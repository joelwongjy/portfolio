import { ReactElement } from "react";

interface SectionHeadingProps {
  title: string;
}

export const SectionHeading = ({
  title,
}: SectionHeadingProps): ReactElement<SectionHeadingProps, "div"> => {
  return (
    <div className="border-b-4 dark:border-white border-black">
      <h1 className="font-bold text-4xl pb-4">{title}</h1>
    </div>
  );
};
