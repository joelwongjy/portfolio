import React, { ReactElement } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { experience } from "@/data/experience";
import { teachingExperience } from "@/data/teachingExperience";
import ExperienceItem from "./experience/ExperienceItem";

export const Experience = (): ReactElement<"div"> => {
  const { title, experiences } = experience;

  return (
    <SectionWrapper>
      <SectionHeading title={title} />
      {experiences
        .filter((exp) => exp.isShown !== false)
        .map((exp, index) => (
          <ExperienceItem experience={exp} key={index} />
        ))}
      {/* <TeachingExperienceItem teachingExperience={teachingExperience} /> */}
    </SectionWrapper>
  );
};
