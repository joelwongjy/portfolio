import { Skills } from "@/constants/technologies";

export interface Project {
  title: string;
  description: string;
  primaryMessage?: string;
  primaryLink?: string;
  secondaryMessage?: string;
  secondaryLink?: string;
  skills: Skills[];
  image: string;
}

export interface ProjectSection {
  title: string;
  projects: Project[];
}

export const project: {
  favoriteProjects: ProjectSection;
  otherProjects: ProjectSection;
} = {
  favoriteProjects: {
    title: "Projects",
    projects: [
      {
        title: "PeerPrep",
        description:
          "Mock-coding interview platform that scrapes questions from Leetcode to start collaborative coding sessions. Built for CS3219 Software Engineering Principles and Patterns.",
        skills: [
          Skills.REACT,
          Skills.REACT_QUERY,
          Skills.CHAKRA_UI,
          Skills.CODEMIRROR,
          Skills.NODE_JS,
          Skills.EXPRESS,
          Skills.MONGODB,
          Skills.SOCKET_IO,
          Skills.PRISMA,
          Skills.DOCKER,
          Skills.AWS,
        ],
        secondaryMessage: "View Source Code",
        secondaryLink:
          "https://github.com/CS3219-AY2324S1/ay2324s1-course-assessment-g03",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1716202829/Screenshot_2024-05-20_at_6.59.13_PM_whosp1.png",
      },
      {
        title: "Wadio",
        description:
          "An iOS app to help National Servicemen countdown to the end of their service. This was my first time coding and I built it from zero experience in 4 months. It has since received over 10,000 downloads.",
        skills: [Skills.SWIFT],
        primaryMessage: "View on the App Store",
        primaryLink:
          "https://apps.apple.com/sg/app/wadio-an-ord-countdown-app/id1509665634",
        secondaryMessage: "View source code on GitHub",
        secondaryLink: "https://github.com/joelwongjy/wadio",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219441/Screen_Shot_2022-03-25_at_10.43.41_PM_uklic2.png",
      },
    ],
  },
  otherProjects: {
    title: "Other Projects",
    projects: [
      {
        title: "OpenJio",
        description:
          "Create OpenJios and join supper orders with your friends! A Progressive Web App built for NUS Orbital Project.",
        skills: [
          Skills.REACT,
          Skills.NODE_JS,
          Skills.POSTGRES,
          Skills.EXPRESS,
          Skills.TYPESCRIPT,
          Skills.TAILWIND,
        ],
        primaryMessage: "View the web app",
        primaryLink: "https://openjio.netlify.app",
        secondaryMessage: "View source code on GitHub",
        secondaryLink: "https://github.com/joelwongjy/openjio",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648220920/OpenJio_px91gk.png",
      },
      {
        title: "YouTube Channel",
        description:
          "I make vlogs about my life in NUS and beyond to document my life and memories. Over 5100 subscribers.",
        skills: [Skills.FINALCUTPRO],
        primaryMessage: "Subscribe to my channel",
        primaryLink: "https://youtube.com/joelwongjy",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219974/Untitled_design_shqob4.png",
      },
    ],
  },
};
