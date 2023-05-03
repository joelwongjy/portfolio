import { Skills } from "@/constants/technologies";

export interface TeachingExperience {
  start: string;
  end: string;
  title: string;
  organisation: string;
  organisationLink: string;
  description: string;
  points: string[];
  modules: { [year: string]: string[] }[];
  stacks: {
    title: string;
    skills: Skills[];
  }[];
}

export const teachingExperience: TeachingExperience = {
  start: "Aug 2021",
  end: "May 2022",
  title: "Teaching Assistant",
  organisation: "nus",
  organisationLink: "http://www.nus.edu.sg/",
  description:
    "Teaching programming sessions on Object-Oriented Programming principles",
  points: [
    "Placed on the Honour List of Tutors awarded to recognise excellence in Teaching among student tutors who have contributed to the teaching/learning at NUS",
  ],
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
