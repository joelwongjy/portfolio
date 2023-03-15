import React, { ReactElement } from "react";
import { SectionHeading } from "./section/SectionHeader";

export const Skills = (): ReactElement<"div"> => {
  return (
    <div className="pt-24 md:pt-36">
      <SectionHeading title="skills" />
    </div>
  );
};
