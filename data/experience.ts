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
      description: "Short-form video and social commerce",
      points: ["Frontend engineer on TikTok Shop"],
      stacks: [
        {
          title: "Tech Stack",
          skills: [Skills.REACT],
        },
      ],
    },
    {
      start: "Dec 2023",
      end: "Mar 2024",
      title: "Full Stack Developer",
      organisation: "kisi",
      organisationLink: "https://www.getkisi.com/",
      description: "Cloud-based access control",
      points: ["Built integrations that connect third-party APIs to Kisi locks"],
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
      description: "Product lifecycle management (PLM) software",
      points: [
        "Built the new Product Information Management (PIM) platform with Salesforce Lightning Web Components (LWC) and Apex",
        "Built lazily rendered components that made pages in the PLM app load faster",
        "Migrated views from React and Redux to LWC",
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
      description: "Southeast Asia's largest e-commerce platform",
      points: [
        "Built features for the product detail page of the core Shopee web app, on the Orders team",
        "Migrated a monolithic repository to a micro-frontend architecture",
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
      description: "Volunteer management for social enterprises",
      points: [
        "Started an overhaul of bantu.life, the volunteer management platform",
        "Redesigned the interface and rebuilt the website on my own in a month",
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
      description: "A tech-for-good student club supported by Google Developers",
      points: [
        "Led a 74-member club that started three software projects for non-profits in Singapore",
        "Ran technical workshops and a hackathon for students",
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
      description: "Building apps for non-profits in Singapore",
      points: [
        "Built a web app with five other developers for CampusImpact, a non-profit for young people",
        "A year-long project: a questionnaire and analytics module that gives teachers a feedback loop",
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
