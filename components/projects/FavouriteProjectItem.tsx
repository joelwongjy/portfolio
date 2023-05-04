import { ReactElement } from "react";
import { Project } from "@/data/projects";
import Image from "next/image";
import ProjectLinks from "./ProjectLinks";

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
    <div className="wrap max-lg:p-4 lg:mx-auto lg:w-5/6">
      <div className="grid-cols-12 lg:grid">
        <a
          href={primaryLink}
          target="_blank"
          className="col-span-7 col-start-1 row-span-full cursor-pointer self-center rounded-xl shadow-card transition-all hover:opacity-70"
        >
          <Image
            src={image}
            alt=""
            width="2260"
            height="1264"
            className="rounded-xl object-cover transition-all duration-300 sm:aspect-[2/1] lg:aspect-[3/2]"
          />
        </a>

        <div className="z-10 col-span-6 col-end-13 row-span-full flex flex-col self-center max-lg:mt-8 lg:items-end">
          <h2 className="mb-4 text-2xl font-bold leading-6">{title}</h2>
          <p className="mt-3 rounded-xl text-[16px] text-sm leading-6 lg:bg-gray-50 lg:p-6 lg:text-right lg:shadow-description lg:dark:bg-gray-900">
            {description}
          </p>

          <div className="mb-4 mt-6 flex flex-wrap gap-x-3 gap-y-1">
            {skills.map((skill, index) => (
              <span key={index} className="font-mono text-sm">
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

        {/* <div className="absolute gap-x-4 bg-zinc-900 px-6 py-4">
      <p className="text-base font-medium">{primaryMessage}</p>
    </div> */}
      </div>
    </div>
  );
};

export default FavouriteProjectItem;
