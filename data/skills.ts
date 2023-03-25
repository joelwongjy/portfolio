import { Skills } from "@/constants/technologies";

export const skills: {
  title: string;
  sections: {
    title: string;
    skills: Skills[];
  }[];
} = {
  title: "skills",
  sections: [
    {
      title: "Frontend / Mobile",
      skills: [
        Skills.REACT,
        Skills.REDUX,
        Skills.VUE,
        Skills.SASS,
        Skills.TYPESCRIPT,
        Skills.SWIFT,
      ],
    },
    {
      title: "Backend",
      skills: [Skills.NODE_JS, Skills.POSTGRES, Skills.EXPRESS],
    },
    {
      title: "Languages",
      skills: [Skills.PYTHON, Skills.JAVA, Skills.GIT],
    },
    {
      title: "Creative",
      skills: [Skills.FIGMA, Skills.FINALCUTPRO],
    },
  ],
};
