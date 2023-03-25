import { Skills } from "@/constants/technologies";

export interface Project {
  title: string;
  descriptions: string[];
  summary: string;
  primaryMessage: string;
  primaryLink: string;
  secondaryMessage?: string;
  secondaryLink?: string;
  skills: Skills[];
  image?: string;
  isFavourite?: boolean;
  isShown?: boolean;
}

export const project: {
  favouriteTitle: string;
  favouriteSubtitle: string;
  regularTitle: string;
  projects: Project[];
} = {
  favouriteTitle: "favourite projects.",
  favouriteSubtitle: "Coding and design projects that I enjoyed working on.",
  regularTitle: "Projects",
  projects: [
    {
      title: "Wadio: An ORD Countdown App",
      descriptions: [
        "My first experience with coding was an app to help NSFs countdown to ORD.",
        "Over 4000 downloads to date.",
      ],
      summary:
        "My first experience with coding was an app to help NSFs countdown to ORD. Over 4000 downloads to date.",
      skills: [Skills.SWIFT],
      primaryMessage: "View on the App Store.",
      primaryLink:
        "https://apps.apple.com/sg/app/wadio-an-ord-countdown-app/id1509665634",
      image:
        "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219441/Screen_Shot_2022-03-25_at_10.43.41_PM_uklic2.png",
    },
    {
      title: "OpenJio",
      descriptions: [
        "Create OpenJios and join supper orders with your friends!",
        "A Progressive Web App built for NUS Orbital Project.",
      ],
      summary:
        "Create OpenJios and join supper orders with your friends! A Progressive Web App built for NUS Orbital Project.",
      skills: [
        Skills.REACT,
        Skills.NODE_JS,
        Skills.POSTGRES,
        Skills.EXPRESS,
        Skills.TYPESCRIPT,
        Skills.TAILWIND,
      ],
      primaryMessage: "View the app.",
      primaryLink: "https://openjio.netlify.app",
      image:
        "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648220920/OpenJio_px91gk.png",
    },
    {
      title: "YouTube Channel",
      descriptions: [],
      summary:
        "I make vlogs about my life in NUS and beyond as a way to document my growth and memories. Over 3500 subscribers to date.",
      skills: [Skills.FINALCUTPRO],
      primaryMessage: "Subscribe to my channel!",
      primaryLink: "https://youtube.com/joelwongjy",
      image:
        "https://res.cloudinary.com/dsk6p2wwo/image/upload/v1648219974/Untitled_design_shqob4.png",
    },
  ],
};
