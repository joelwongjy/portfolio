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
    <section
      className={
        className
          ? `mt-12 md:mt-24 flex flex-col ${className}`
          : "mt-12 md:mt-24 flex flex-col"
      }
    >
      {children}
    </section>
  );
};
