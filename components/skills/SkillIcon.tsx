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
    <div className="mx-2 flex h-8 w-8">
      <Svgr />
    </div>
  );
};
