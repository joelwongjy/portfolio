import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";
import { getSvgrFromSkill } from "@/utils/skillUtils";

interface SkillCardProps {
  skill: Skills;
}

export const SkillCard = ({
  skill,
}: SkillCardProps): ReactElement<SkillCardProps, "div"> => {
  const Svgr = getSvgrFromSkill(skill);

  return (
    <div className="flex flex-row items-center w-64 h-16 bg-gray-50 rounded-lg px-2 py-4">
      <div className="w-8 h-8 mx-2">
        <Svgr />
      </div>
      <h3 className=" font-medium">{skill}</h3>
    </div>
  );
};
