import React, { ReactElement, useState } from "react";
import { SectionHeading } from "./section/SectionHeading";
import { SectionWrapper } from "./section/SectionWrapper";
import { skills } from "@/data/skills";
import { SkillGrid } from "./skills/SkillGrid";

export const Skills = (): ReactElement<typeof SectionWrapper> => {
  const { title, sections } = skills;
  const [selectedSection, setSelectedSection] = useState(0);

  return (
    <SectionWrapper>
      <SectionHeading title={title} />
      <div className="grid grid-cols-2">
        <div className={`grid grid-rows-${sections.length}`}>
          {sections.map((section, index) => {
            return (
              <button
                key={index}
                className="cursor-pointer border-b-2 hover:bg-purple-100"
                onClick={() => setSelectedSection(index)}
              >
                {section.title}
              </button>
            );
          })}
        </div>
        <div className="h-96">
          <SkillGrid skills={sections[selectedSection].skills} />
        </div>
      </div>
    </SectionWrapper>
  );
};
