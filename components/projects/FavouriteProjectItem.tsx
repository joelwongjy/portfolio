import { ReactElement } from "react";
import { Project } from "@/data/projects";
import Image from "next/image";
import ProjectLinks from "./ProjectLinks";
import { SkillIcon } from "../skills/SkillIcon";

interface FavouriteProjectProps {
  project: Project;
}

const FavouriteProjectItem = (
  props: FavouriteProjectProps
): ReactElement<FavouriteProjectProps, "div"> => {
  const { project } = props;
  const {
    title,
    description,
    primaryMessage,
    primaryLink,
    secondaryMessage,
    secondaryLink,
    skills,
    image,
  } = project;

  return (
    <div className="wrap">
      <a
        href={primaryLink}
        target="_blank"
        className="cursor-pointer rounded-xl transition-all hover:opacity-70"
      >
        <Image
          src={image}
          alt=""
          width="400"
          height="500"
          className="aspect-[16/9] rounded-xl object-cover transition-all duration-300"
        />
      </a>

      <div className="z-10 mt-8 flex flex-col">
        <h2 className="mb-4 mr-8 text-2xl font-bold leading-6">{title}</h2>
        <p className="mt-3 rounded-xl text-[16px] leading-7">{description}</p>

        <div className="mb-12 mt-6 flex flex-wrap gap-x-3 gap-y-4">
          {skills.map((skill, index) => (
            <SkillIcon key={index} skill={skill} showLabel />
          ))}
        </div>

        <ProjectLinks
          primaryLink={primaryLink}
          primaryMessage={primaryMessage}
          secondaryLink={secondaryLink}
          secondaryMessage={secondaryMessage}
        ></ProjectLinks>

        {/* <div className="absolute gap-x-4 bg-zinc-900 px-6 py-4">
      <p className="text-base font-medium">{primaryMessage}</p>
    </div> */}
      </div>
    </div>
  );
};

export default FavouriteProjectItem;
