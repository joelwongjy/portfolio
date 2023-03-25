import { Skills } from "@/constants/technologies";

export interface TeachingExperience {
  start: string;
  end: string;
  title: string;
  organisation: string;
  organisationLink: string;
  description: string;
  modules: { [year: string]: string[] }[];
  stacks: {
    title: string;
    skills: Skills[];
  }[];
}

export const teachingExperience: TeachingExperience = {
  start: "Aug 2021",
  end: "Present",
  title: "Teaching Assistant",
  organisation: "National University of Singapore",
  organisationLink: "http://www.nus.edu.sg/",
  description:
    "Teaching programming lab sessions focused on Object-Oriented Programming principles in Java.",
  modules: [
    { "Year 2 Semester 1": ["CS2030S"] },
    { "Year 2 Semester 2": ["CS2030"] },
  ],
  stacks: [
    {
      title: "Tech Stack",
      skills: [Skills.JAVA],
    },
  ],
};
