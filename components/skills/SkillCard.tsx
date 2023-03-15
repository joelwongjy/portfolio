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
    <div className="border-2 border-stone-100">
      <Svgr />
    </div>
  );
};
