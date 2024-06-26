import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";
import { SkillCard } from "./SkillCard";

interface SkillGridProps {
  section: {
    title: string;
    skills: Skills[];
  };
}

export const SkillGrid = ({
  section,
}: SkillGridProps): ReactElement<SkillGridProps, "div"> => {
  const { title, skills } = section;

  return (
    <div>
      <h2 className="mb-6 hidden text-2xl font-bold lg:block">{title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {skills.map((skill) => {
          return <SkillCard key={skill} skill={skill} />;
        })}
      </div>
    </div>
  );
};
