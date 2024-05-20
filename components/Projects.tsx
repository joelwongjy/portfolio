import React, { ReactElement, useState } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { project } from "@/data/projects";
import ProjectItem from "./projects/ProjectItem";
import FavouriteProjectItem from "./projects/FavouriteProjectItem";

export const Projects = (): ReactElement<"div"> => {
  const { favoriteProjects, otherProjects } = project;

  return (
    <div>
      <SectionWrapper>
        <SectionHeading title={favoriteProjects.title} />
        <div className="mx-auto my-8 mb-20 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 lg:mx-0 lg:max-w-none lg:gap-y-24">
          {favoriteProjects.projects.map((project, index) => (
            <FavouriteProjectItem
              project={project}
              key={index}
            ></FavouriteProjectItem>
          ))}
        </div>
      </SectionWrapper>
      <SectionWrapper>
        <SectionHeading title={otherProjects.title} />
        <div className="mx-auto my-8 mb-20 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
          {otherProjects.projects.map((project, index) => (
            <ProjectItem project={project} key={index} />
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
};
