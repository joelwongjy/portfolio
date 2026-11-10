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
  /** the garage's team colour */
  color: string;
  /** glyph for the garage fascia and lists, see components/v2/projectIcons */
  icon: "code" | "countdown" | "supper" | "play";
  /** one line for lists */
  tagline: string;
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
        color: "#7C5CFF",
        icon: "code",
        tagline: "Mock interviews in a shared code editor",
        description:
          "Practice for technical interviews: PeerPrep pulls questions from LeetCode and pairs you with someone in a live, shared code editor. Built for CS3219, Software Engineering Principles and Patterns.",
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
        secondaryMessage: "Source code",
        secondaryLink:
          "https://github.com/CS3219-AY2324S1/ay2324s1-course-assessment-g03",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1716202829/Screenshot_2024-05-20_at_6.59.13_PM_whosp1.png",
      },
      {
        title: "Wadio",
        color: "#E8352B",
        icon: "countdown",
        tagline: "iOS countdown to the end of National Service",
        description:
          "An iOS countdown to the end of National Service. It's the first thing I ever coded, built from scratch in four months, and it has been downloaded more than 10,000 times.",
        skills: [Skills.SWIFT],
        primaryMessage: "App Store",
        primaryLink:
          "https://apps.apple.com/sg/app/wadio-an-ord-countdown-app/id1509665634",
        secondaryMessage: "Source code",
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
        color: "#F2A31B",
        icon: "supper",
        tagline: "Open invites for supper orders",
        description:
          "Start an open invite for a late-night supper order and let friends join in. A progressive web app built for NUS Orbital.",
        skills: [
          Skills.REACT,
          Skills.NODE_JS,
          Skills.POSTGRES,
          Skills.EXPRESS,
          Skills.TYPESCRIPT,
          Skills.TAILWIND,
        ],
        primaryMessage: "Open the app",
        primaryLink: "https://openjio.netlify.app",
        secondaryMessage: "Source code",
        secondaryLink: "https://github.com/joelwongjy/openjio",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648220920/OpenJio_px91gk.png",
      },
      {
        title: "YouTube Channel",
        color: "#FF2D2D",
        icon: "play",
        tagline: "Vlogs about NUS and after",
        description:
          "Vlogs about student life at NUS and what came after. More than 5,100 subscribers.",
        skills: [Skills.FINALCUTPRO],
        primaryMessage: "Watch on YouTube",
        primaryLink: "https://youtube.com/joelwongjy",
        image:
          "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219974/Untitled_design_shqob4.png",
      },
    ],
  },
};
