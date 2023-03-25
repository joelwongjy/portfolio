import React, { ReactElement } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { aboutMe } from "@/data/aboutMe";

export const AboutMe = (): ReactElement<"div"> => {
  return (
    <SectionWrapper>
      <SectionHeading title={aboutMe.title} />
      <span className="md:text-xl">{aboutMe.body[1]}</span>
    </SectionWrapper>
  );
};
