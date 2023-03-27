import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";
import { getSvgrFromSkill } from "@/utils/skillUtils";

interface SkillIconProps {
  skill: Skills;
}

export const SkillIcon = ({
  skill,
}: SkillIconProps): ReactElement<SkillIconProps, "div"> => {
  const Svgr = getSvgrFromSkill(skill);

  return (
    <div className="group mx-2 flex h-8 w-8 justify-center hover:last:opacity-100">
      <Svgr />
      <div className="absolute mt-10 text-sm font-medium text-gray-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-gray-200">
        {skill as string}
      </div>
    </div>
  );
};
