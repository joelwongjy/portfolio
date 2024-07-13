import { ReactElement, useEffect, useState } from "react";
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

  const [mode, setMode] = useState("light");

  const hasLogo = organisationToLogo[organisation] != null;
  const hasWhiteLogo = organisationToLogo[`${organisation}White`] != null;

  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => setMode(e.matches ? "dark" : "light"));

    setMode(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    );

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", () => {});
    };
  }, []);

  const organisationContent = hasLogo ? (
    <Image
      className="max-w-96 h-12 object-contain object-left md:h-16"
      alt={organisation}
      src={
        mode === "dark" && hasWhiteLogo
          ? organisationToLogo[`${organisation}White`]
          : organisationToLogo[organisation]
      }
    />
  ) : (
    organisation
  );

  return (
    <div className="grid grid-cols-1 gap-8 rounded-3xl py-10 md:grid-cols-3 md:gap-16">
      <div className="col-span-1">
        <a target="_blank" href={organisationLink}>
          {organisationContent}
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

export default ExperienceItem;
