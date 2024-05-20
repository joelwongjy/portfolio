import React, { ReactElement } from "react";
import { hero } from "@/data/hero";
import Image from "next/image";
import profilePic from "../public/hero.jpg";
import { Button } from "./buttons/Button";

export const Hero = (): ReactElement<"div"> => {
  const { firstName, lastName, title, body, resumeLink } = hero;

  return (
    <div className="pt-20 md:pt-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col ">
          <h1 className="flex flex-col text-6xl font-extrabold md:text-7xl">
            <span>{firstName}</span>
            <span>{lastName}</span>
          </h1>
          <h2 className="pt-4 text-3xl font-extralight tracking-wide md:text-5xl">
            {title}
          </h2>
        </div>
        <div className="mt-10 w-80 md:mt-0">
          <p className="text-small mb-4 font-light leading-7 md:text-left md:text-lg">
            {body}
          </p>
          <Button href={resumeLink} label="Download Resume" />
        </div>
      </div>
      <Image
        src={profilePic}
        alt="Profile picture"
        className="mt-16 h-72 rounded-3xl object-cover md:h-96"
      ></Image>
    </div>
  );
};
