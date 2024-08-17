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
    <SectionWrapper className="">
      <SectionHeading title={title} />
      <div className="relative">
        <SkillGrid section={sections[selectedSection]} />
        <div className="sticky bottom-8 flex justify-center">
          <SkillNavbar
            sections={sections}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
          ></SkillNavbar>
        </div>
      </div>
    </SectionWrapper>
  );
};
