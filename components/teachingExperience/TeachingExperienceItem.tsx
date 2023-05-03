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
    <div className="grid grid-cols-1 gap-8 rounded-3xl py-10 md:grid-cols-3 md:gap-16">
      <div className="col-span-1">
        <a target="_blank" href={organisationLink}>
          <Image
            className="h-12 object-contain object-left md:h-16"
            alt={organisation}
            src={organisationToLogo[organisation]}
          />
        </a>
        <h2 className="mt-4 font-semibold max-md:text-2xl">{title}</h2>
        <h3 className="mt-1">{`${start} - ${end}`}</h3>
      </div>
      <div className="col-span-2 flex flex-col items-start">
        <h2 className="mb-6 font-semibold max-md:text-lg">{description}</h2>
        {points.map((point, index) => (
          <p className="mb-3" key={index}>
            {point}
          </p>
        ))}
        <div>
          {modules.map((module, index) => {
            const year = Object.keys(module)[0];
            if (year == null) {
              return null;
            }

            return (
              <div className="flex items-center gap-2 my-5" key={index}>
                <h2 className="font-bold">&gt;</h2>
                <div className="flex items-center">
                  <p className="font-medium mr-3">{year}:</p>
                  {module[year]?.map((m, index) => (
                    <div key={index} className="flex flex-column">
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
          <div key={index} className="mt-3 flex flex-col items-start">
            <div className="mb-4 rounded-full bg-gray-100 px-4 py-2 font-semibold dark:bg-gray-900">
              {stack.title}
            </div>
            <div className="flex gap-2">
              {stack.skills.map((skill, index) => (
                <SkillIcon key={index} skill={skill} showLabel />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeachingExperienceItem;
