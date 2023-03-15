import { ReactElement } from "react";

interface SectionHeadingProps {
  title: string;
}

export const SectionHeading = ({
  title,
}: SectionHeadingProps): ReactElement<SectionHeadingProps, "div"> => {
  return (
    <div className="border-b-4 border-b-black">
      <h2 className="font-bold text-4xl pb-4">{title}</h2>
    </div>
  );
};
