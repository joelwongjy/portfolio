import { ReactElement } from "react";
import { Project } from "@/data/projects";
import Image from "next/image";
import ProjectLinks from "./ProjectLinks";

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
      className="group/project flex cursor-pointer flex-col overflow-hidden rounded-xl border p-4 transition-all hover:shadow-card dark:border-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <div className="w-full overflow-hidden rounded-xl">
        <Image
          src={image}
          alt=""
          width="1000"
          height="1000"
          className="rounded-xl object-cover transition-all duration-300 group-hover/project:scale-110 sm:aspect-[2/1] lg:aspect-[3/2]"
        />
      </div>

      <div className="px-4 pb-4 pt-8">
        <div className="h-28">
          <h2 className="font-semibold leading-6">{title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6">{description}</p>
        </div>

        <div className="my-6 flex flex-wrap gap-x-3 gap-y-1">
          {skills.map((skill, index) => (
            <span key={index} className="font-mono text-xs">
              {skill}
            </span>
          ))}
        </div>
           
        <ProjectLinks
          primaryLink={primaryLink}
          primaryMessage={primaryMessage}
          secondaryLink={secondaryLink}
          secondaryMessage={secondaryMessage}
        ></ProjectLinks>
      </div>
    </a>
  );
};

export default ProjectItem;
