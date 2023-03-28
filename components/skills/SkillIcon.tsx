import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";
import { getSvgrFromSkill } from "@/utils/skillUtils";

interface SkillIconProps {
  skill: Skills;
  showLabel?: boolean;
}

export const SkillIcon = ({
  skill,
  showLabel,
}: SkillIconProps): ReactElement<SkillIconProps, "div"> => {
  const Svgr = getSvgrFromSkill(skill);

  return (
    <div className="group mx-2 flex h-10 w-10 justify-center">
      <div className="flex h-8 w-8 justify-center transition-all ease-in-out group-hover:h-10 group-hover:w-10">
        <Svgr />
      </div>
      {showLabel && (
        <div className="absolute mt-12 hidden text-sm font-medium text-gray-500 transition-opacity duration-150 group-hover:block dark:text-gray-200">
          {skill as string}
        </div>
      )}
    </div>
  );
};
