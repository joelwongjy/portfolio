import { ReactElement } from "react";
import Image from "next/image";

import ModuleCode from "./ModuleCode";
import { SkillIcon } from "../skills/SkillIcon";
import { TeachingExperience } from "@/data/teachingExperience";
import { organisationToLogo } from "@/constants/logos";

interface TeachingExperienceProps {
  teachingExperience: TeachingExperience;
}

const TeachingExperienceItem = (
  props: TeachingExperienceProps
): ReactElement<TeachingExperienceProps, "div"> => {
  const { teachingExperience } = props;
  const {
    start,
    end,
    title,
    organisation,
    organisationLink,
    description,
    points,
    modules,
    stacks,
  } = teachingExperience;

  return (
    <div className="flex flex-col items-start">
      <a target="_blank" href={organisationLink}>
        <Image
          className="h-12 object-contain object-left"
          alt={organisation}
          src={organisationToLogo[organisation]}
        />
      </a>
      <h2 className="mt-1 text-base font-medium italic text-gray-500 dark:text-gray-300">
        {description}
      </h2>
      <p className="mb-2 mt-6 font-semibold">
        {title}, {`${start} - ${end}`}
      </p>
      {points.map((point, index) => (
        <div key={index} className="mb-2 flex flex-row">
          <span className="mx-4">•</span>
          <span>{point}</span>
        </div>
      ))}
      <div>
        {modules.map((module, index) => {
          const year = Object.keys(module)[0];
          if (year == null) {
            return null;
          }
          return (
            <div className="my-2 flex items-center gap-2" key={index}>
              <p className="">&gt;</p>
              <div className="flex items-center">
                <p className="mr-3 font-medium">{year}:</p>
                {module[year]?.map((m, index) => (
                  <div key={index} className="flex-column flex">
                    {index !== 0 && <span className="mx-2">|</span>}
                    <ModuleCode moduleCode={m} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {stacks.map((stack, index) => (
        <div key={index} className="mt-4 flex flex-col items-start">
          <div className="flex gap-2">
            {stack.skills.map((skill, index) => (
              <SkillIcon key={index} skill={skill} showLabel />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeachingExperienceItem;
