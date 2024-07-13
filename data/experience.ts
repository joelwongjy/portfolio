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
      start: "Jul 2024",
      end: "Present",
      title: "Frontend Engineer",
      organisation: "tiktok",
      organisationLink: "https://www.tiktok.com/about?lang=en",
      description: "Social media platform for sharing short-form videos",
      points: ["Working on TikTok Shop"],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.REACT],
        },
      ],
      isShown: false,
    },
    {
      start: "Dec 2023",
      end: "Mar 2024",
      title: "Full Stack Developer",
      organisation: "kisi",
      organisationLink: "https://www.getkisi.com/",
      description: "Cloud-based door-access software",
      points: [
        "Built new integrations linking third-party APIs to Kisi locks",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.REACT, Skills.REACT_QUERY, Skills.FIREBASE],
        },
      ],
    },
    {
      start: "Aug 2022",
      end: "Dec 2023",
      title: "Software Engineer Intern",
      organisation: "propel",
      organisationLink: "https://www.propelsoftware.com/",
      description: "Product Lifecycle Management (PLM) Software",
      points: [
        "Built the new Product Information Management (PIM) platform in Salesforce Lightning Web Components (LWC) and Apex",
        "Built lazy-rendering components to allow faster page load speeds in PLM app",
        "Migrated from React and Redux to LWC",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.SALESFORCE, Skills.REACT, Skills.REDUX],
        },
      ],
    },
    {
      start: "May 2022",
      end: "Aug 2022",
      title: "Software Engineer Intern",
      organisation: "shopee",
      organisationLink: "https://shopee.sg/",
      description: "Largest e-commerce platform in Southeast Asia",
      points: [
        "Frontend Engineer in the Orders Team building features for the Product Detail Page in the core Shopee web app",
        "Migrated monolithic repository to micro frontend architecture",
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
      title: "Frontend Engineer Intern",
      organisation: "bantu",
      organisationLink: "https://bantu.life/",
      description: "Volunteer Management System for Social Enterprises",
      points: [
        "Initiated an overhaul of the Volunteer Management Platform bantu.life",
        "Singlehandedly redesigned user interface and coded new website within one month",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.REACT, Skills.VUE, Skills.LARAVEL, Skills.TAILWIND],
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
        "Led a team of 74 members to start 3 new software development projects for Non-Profit Organizations in Singapore",
        "Spearheaded technology workshops and a hackathon to build generative skills in tech in students",
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
      description: "Building apps for Non-Profits in Singapore",
      points: [
        "Developed a web application with five web developers for CampusImpact, non-profit organization targeting youths",
        "Year-long project to create a questionnaire and analytics module for teachers to build feedback loops",
      ],
      stacks: [
        {
          title: "Tech Stack",
          skills: [
            Skills.REACT,
            Skills.NODE_JS,
            Skills.EXPRESS,
            Skills.POSTGRES,
            Skills.DOCKER,
            Skills.MATERIAL_UI,
          ],
        },
      ],
    },
  ],
};
