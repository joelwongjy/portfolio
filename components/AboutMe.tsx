import React, { ReactElement } from "react";
import { SectionHeading } from "./section/SectionHeader";

export const AboutMe = (): ReactElement<"div"> => {
  return (
    <div className="pt-24 md:pt-36 flex flex-col">
      <SectionHeading title="about me" />
    </div>
  );
};
