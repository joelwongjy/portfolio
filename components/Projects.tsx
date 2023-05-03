import React, { ReactElement } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { project } from "@/data/projects";
import ProjectItem from "./projects/ProjectItem";

export const Projects = (): ReactElement<"div"> => {
  const { title, projects } = project;

  return (
    <SectionWrapper>
      <SectionHeading title={title} />
      <div className="mx-auto my-8 mb-20 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
        {projects
          .filter((exp) => exp.isShown !== false)
          .map((project, index) => (
            <ProjectItem project={project} key={index} />
          ))}
      </div>
    </SectionWrapper>
  );
};
