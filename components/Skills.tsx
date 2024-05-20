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
    <SectionWrapper className="h-128">
      <SectionHeading title={title} />
      <div className="gap-12 lg:grid lg:grid-cols-2 lg:items-start">
        <SkillNavbar
          sections={sections}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
        ></SkillNavbar>
        <SkillGrid section={sections[selectedSection]} />
      </div>
    </SectionWrapper>
  );
};
