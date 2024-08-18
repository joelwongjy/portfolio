import { ReactElement, ReactNode } from "react";

interface SectionWrapperProps {
  className?: string;
  children: ReactNode;
}

export const SectionWrapper = ({
  className,
  children,
}: SectionWrapperProps): ReactElement<SectionWrapperProps, "section"> => {
  return (
    <section className={`${className} my-20 flex flex-col`}>{children}</section>
  );
};
