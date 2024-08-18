import React, { ReactElement, useState } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { project } from "@/data/projects";
import ProjectItem from "./projects/ProjectItem";
import FavouriteProjectItem from "./projects/FavouriteProjectItem";

export const Projects = (): ReactElement<typeof SectionWrapper> => {
  const { favoriteProjects, otherProjects } = project;

  return (
    <SectionWrapper>
      <SectionHeading title={favoriteProjects.title} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {favoriteProjects.projects.map((project, index) => (
          <ProjectItem project={project} key={index}></ProjectItem>
        ))}
        {otherProjects.projects.map((project, index) => (
          <ProjectItem project={project} key={index} />
        ))}
      </div>
    </SectionWrapper>
  );
};
