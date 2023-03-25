import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";
import { getSvgrFromSkill } from "@/utils/skillUtils";
import { SkillCard } from "./SkillCard";

interface SkillGridProps {
  skills: Skills[];
}

export const SkillGrid = ({
  skills,
}: SkillGridProps): ReactElement<SkillGridProps, "div"> => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {skills.map((skill) => {
        return <SkillCard key={skill} skill={skill} />;
      })}
    </div>
  );
};
