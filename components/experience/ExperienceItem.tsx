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
      className="h-12 object-contain object-left"
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
    <div className="flex flex-col items-start">
      <a target="_blank" href={organisationLink}>
        {organisationContent}
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

export default ExperienceItem;
