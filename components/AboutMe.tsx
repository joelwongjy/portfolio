import React, { ReactElement } from "react";
import { SectionWrapper } from "./section/SectionWrapper";
import { SectionHeading } from "./section/SectionHeading";
import { aboutMe } from "@/data/aboutMe";

export const AboutMe = (): ReactElement<"div"> => {
  const { title, body } = aboutMe;

  return (
    <SectionWrapper>
      <SectionHeading title={title} />
      {body.map((item, index) => {
        return (
          <p
            key={index}
            className="mb-4 md:text-xl md:leading-relaxed lg:w-2/3"
          >
            {item}
          </p>
        );
      })}
    </SectionWrapper>
  );
};
