import React, { ReactElement } from "react";
import { hero } from "@/data/hero";
import Image from "next/image";
import profilePic from "../public/hero.jpg";
import { Button } from "./buttons/Button";
import { aboutMe } from "@/data/aboutMe";

export const Hero = (): ReactElement<"div"> => {
  const { firstName, lastName, title, body, resumeLink } = hero;
  const { body: aboutMeBody } = aboutMe;

  return (
    <div className="pt-40">
      <div className="items-top m-auto mb-8 flex flex-row items-center justify-between">
        <h1>
          {firstName} {lastName}
        </h1>
        <h2>{body}</h2>
      </div>
      {aboutMeBody.map((item, index) => (
        <p
          key={index}
          className="md:text-md text-md md:leading-relaxed [&:not(first)]:mt-4"
        >
          {item}
        </p>
      ))}
      <Image
        src={profilePic}
        alt="Profile picture"
        className="mt-8 h-64 rounded-3xl object-cover"
      ></Image>
    </div>
  );
};
