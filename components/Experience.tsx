import React, { ReactElement } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { experience } from "@/data/experience";
import { teachingExperience } from "@/data/teachingExperience";
import ExperienceItem from "./experience/ExperienceItem";
import TeachingExperienceItem from "./teachingExperience/TeachingExperienceItem";

export const Experience = (): ReactElement<"div"> => {
  const { title, experiences } = experience;

  return (
    <SectionWrapper>
      <SectionHeading title={title} />
      {experiences
        .filter((exp) => exp.isShown !== false)
        .map((exp, index) => (
          <div key={index}>
            <ExperienceItem experience={exp} />
            <hr className="my-8 border-neutral-100 dark:border-neutral-800"></hr>
          </div>
        ))}
      <TeachingExperienceItem teachingExperience={teachingExperience} />
    </SectionWrapper>
  );
};
