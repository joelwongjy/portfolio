import { Skills } from "@/constants/technologies";

export interface Experience {
  start: string;
  end: string;
  title: string;
  organisation: string;
  organisationLink: string;
  description: string;
  points: string[];
  stacks: {
    title: string;
    skills: Skills[];
  }[];
  isShown?: boolean; // Shown by default, set to false to hide
}

export const experience: {
  title: string;
  experiences: Experience[];
} = {
  title: "Experience",
  experiences: [
    {
      start: "May 2022",
      end: "Present",
      title: "Software Engineer Intern",
      organisation: "shopee",
      organisationLink: "https://shopee.sg/",
      description: "Largest e-commerce platform in Southeast Asia",
      points: [
        "Build features and perform fixes for the Web Frontend Orders team",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.REACT, Skills.REDUX, Skills.SASS],
        },
      ],
    },
    {
      start: "May 2021",
      end: "Sep 2021",
      title: "Software Engineer Intern",
      organisation: "bantu",
      organisationLink: "https://bantu.life/",
      description: "A social enterprise startup",
      points: [
        "Initiated a complete overhaul of community portal bantu.life for over 15,000 unique users.",
        "Singlehandedly redesigned user interface and coded new website within one month.",
        "Performed fixes and improvements for the main product, bantu Workspace.",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.REACT, Skills.VUE, Skills.LARAVEL],
        },
      ],
    },
    {
      start: "Aug 2021",
      end: "Jun 2022",
      title: "Lead (President)",
      organisation: "gdsc",
      organisationLink:
        "https://gdsc.community.dev/national-university-of-singapore/",
      description: "A #TechForGood club supported by Google Developers",
      points: [
        "Leading a team of 74 members to build technology solutions for the community and harness tech for social good.",
        "Oversaw 3 new software development projects for Non-Profit Organizations in Singapore.",
        "Built a team to conduct technology workshops and organize a Hackathon to inspire students to build generative skills in tech.",
      ],
      stacks: [],
    },
    {
      start: "Sep 2020",
      end: "Nov 2021",
      title: "Software Engineer",
      organisation: "gdsc",
      organisationLink:
        "https://gdsc.community.dev/national-university-of-singapore/",
      description:
        "Building an app for CampusImpact, a Non-Profit Organization in Singapore",
      points: [
        "One of five Software Engineers developing a full-stack Progressive Web App.",
        "Worked closely alongside Product Designers and Product Managers to ensure client's needs are met.",
        "Built a questionnaire module for teachers to create regular feedback loops.",
        "Developed a gamified student experience alongside admin console for the children.",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [
            Skills.REACT,
            Skills.NODE_JS,
            Skills.POSTGRES,
            Skills.EXPRESS,
            Skills.TYPESCRIPT,
            Skills.MATERIAL_UI,
          ],
        },
      ],
    },
  ],
};
