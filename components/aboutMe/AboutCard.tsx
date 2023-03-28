import { ReactElement } from "react";
import { Skills } from "@/constants/technologies";

interface AboutCardProps {
  skill: Skills;
}

export const AboutCard = ({
  skill,
}: AboutCardProps): ReactElement<AboutCardProps, "div"> => {
  return (
    <div className="flex h-16 flex-row items-center overflow-clip rounded-lg bg-gray-100 px-2 py-4 dark:bg-gray-900">
      <h3 className="font-medium">{skill}</h3>
    </div>
  );
};
