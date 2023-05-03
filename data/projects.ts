import { Skills } from "@/constants/technologies";

export interface Project {
  title: string;
  description: string;
  primaryMessage: string;
  primaryLink: string;
  secondaryMessage?: string;
  secondaryLink?: string;
  skills: Skills[];
  image: string;
  isFavourite?: boolean;
  isShown?: boolean;
}

export const project: {
  title: string;
  projects: Project[];
} = {
  title: "projects",
  projects: [
    {
      title: "Wadio",
      description:
        "My first experience with coding was an iOS app to help National Servicemen countdown to the end of their service. Over 10,000 downloads.",
      skills: [Skills.SWIFT],
      primaryMessage: "View on the App Store",
      primaryLink:
        "https://apps.apple.com/sg/app/wadio-an-ord-countdown-app/id1509665634",
      image:
        "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219441/Screen_Shot_2022-03-25_at_10.43.41_PM_uklic2.png",
    },
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
      image:
        "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648220920/OpenJio_px91gk.png",
    },
    {
      title: "YouTube Channel",
      description:
        "I make vlogs about my life in NUS and beyond to document my life and memories. Over 4700 subscribers.",
      skills: [Skills.FINALCUTPRO],
      primaryMessage: "Subscribe to my channel",
      primaryLink: "https://youtube.com/joelwongjy",
      image:
        "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219974/Untitled_design_shqob4.png",
    },
  ],
};
