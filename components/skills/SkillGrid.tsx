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
    <div className="flex h-16 flex-row items-center gap-2 overflow-clip rounded-2xl bg-framerlight p-4 shadow-framerlight dark:bg-framerdark dark:shadow-framerdark">
      <SkillIcon skill={skill} />
      <h3 className="font-medium">{skill}</h3>
    </div>
  );
};

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
    <div className="mb-32 h-96 md:h-44">
      <h2 className="mb-6 block text-xl font-semibold md:hidden">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {skills.map((skill) => {
          return <SkillCard key={skill} skill={skill} />;
        })}
      </div>
    </div>
  );
};
