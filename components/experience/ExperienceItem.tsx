import { ReactElement } from "react";
import Image from "next/image";

import { SkillIcon } from "../skills/SkillIcon";
import { organisationToLogo } from "@/constants/logos";
import { Experience } from "@/data/experience";

interface ExperienceProps {
  experience: Experience;
}

const ExperienceItem = (
  props: ExperienceProps
): ReactElement<ExperienceProps, "div"> => {
  const { experience } = props;
  const {
    start,
    end,
    title,
    organisation,
    organisationLink,
    description,
    points,
    stacks,
  } = experience;

  const hasLogo = organisationToLogo[organisation] != null;

  const organisationContent = hasLogo ? (
    <Image
      className="w-48 object-contain"
      alt={organisation}
      src={organisationToLogo[organisation]}
    />
  ) : (
    organisation
  );

  return (
    <div className="mb-8 grid grid-cols-3 gap-4 rounded-3xl p-8">
      <div className="col-span-1">
        <a target="_blank" href={organisationLink}>
          {organisationContent}
        </a>
        <h2 className="mt-4 font-medium">{title}</h2>{" "}
        <h3 className="mb-4">{`${start} - ${end}`}</h3>
      </div>
      <div className="col-span-2">
        <h2 className="mb-4 font-semibold">{description}</h2>
        <div className="experience-item__description">
          {points.map((point, index) => (
            <p className="mb-4" key={index}>
              {point}
            </p>
          ))}
          {stacks.map((stack, index) => (
            <div key={index}>
              <div className="">{stack.title}</div>
              <div className="flex">
                {stack.skills.map((skill, index) => (
                  <SkillIcon key={index} skill={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceItem;
