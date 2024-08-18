import { ReactElement } from "react";

interface SectionHeadingProps {
  title: string;
}

export const SectionHeading = ({
  title,
}: SectionHeadingProps): ReactElement<SectionHeadingProps, "div"> => {
  return (
    <div className="mb-6">
      <h1 className="pr-8 font-bold">{title}</h1>
    </div>
  );
};
