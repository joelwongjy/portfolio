import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";
import { SkillIcon } from "./SkillIcon";

interface SkillCardProps {
  skill: Skills;
}

export const SkillCard = ({
  skill,
}: SkillCardProps): ReactElement<SkillCardProps, "div"> => {
  return (
    <div className="flex h-16 flex-row items-center gap-2 overflow-clip rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
      <SkillIcon skill={skill} />
      <h3 className="font-medium">{skill}</h3>
    </div>
  );
};
