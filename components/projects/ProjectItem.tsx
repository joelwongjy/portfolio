import { ReactElement } from "react";
import { Project } from "@/data/projects";
import Image from "next/image";
import { SkillIcon } from "../skills/SkillIcon";

interface ProjectProps {
  project: Project;
}

const ProjectItem = (
  props: ProjectProps
): ReactElement<ProjectProps, "div"> => {
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
    <a
      href={primaryLink}
      target="_blank"
      className="group/project flex cursor-pointer flex-col overflow-hidden rounded-xl p-4 transition-all border dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-900 hover:shadow-card"
    >
      <div className="w-full overflow-hidden rounded-xl">
        <Image
          src={image}
          alt=""
          width="1000"
          height="1000"
          className="object-cover rounded-xl transition-all duration-300 group-hover/project:scale-110 sm:aspect-[2/1] lg:aspect-[3/2]"
        />
      </div>

      <div className="px-4 pt-8 pb-4">
        <div className="h-28">
          <h2 className="font-semibold leading-6">{title}</h2>
          <p className="mt-5 text-sm leading-6 line-clamp-3">{description}</p>
        </div>

        <div className="mt-6 flex gap-2">
          {skills.map((skill, index) => (
            <SkillIcon key={index} skill={skill} showLabel />
          ))}
        </div>
      </div>

      {/* <div className="absolute gap-x-4 bg-zinc-900 px-6 py-4">
        <p className="text-base font-medium">{primaryMessage}</p>
      </div> */}
    </a>
  );
};

export default ProjectItem;
