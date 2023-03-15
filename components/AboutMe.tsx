import React, { ReactElement } from "react";
import { SectionHeading } from "./section/SectionHeader";

export const AboutMe = (): ReactElement<"div"> => {
  return (
    <div className="pt-12 md:pt-24 flex flex-col">
      <SectionHeading title="about me" />
    </div>
  );
};
