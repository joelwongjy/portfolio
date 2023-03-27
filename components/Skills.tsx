import React, { ReactElement, useState } from "react";
import { SectionHeading } from "./section/SectionHeading";
import { SectionWrapper } from "./section/SectionWrapper";
import { skills } from "@/data/skills";
import { SkillGrid } from "./skills/SkillGrid";
import { SkillNavbar } from "./skills/SkillNavbar";

export const Skills = (): ReactElement<typeof SectionWrapper> => {
  const { title, sections } = skills;
  const [selectedSection, setSelectedSection] = useState(0);

  return (
    <SectionWrapper className="h-128 md:h-full">
      <SectionHeading title={title} />
      <div className="gap-12 md:grid md:grid-cols-2 md:items-center">
        <SkillNavbar
          sections={sections}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
        ></SkillNavbar>
        <SkillGrid skills={sections[selectedSection].skills} />
      </div>
    </SectionWrapper>
  );
};
