import { Skills } from "@/constants/technologies";
import {
  CircleStackIcon,
  CodeBracketSquareIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/solid";
import { RefAttributes } from "react";

export const skills: {
  title: string;
  sections: {
    title: string;
    icon: React.ForwardRefExoticComponent<
      Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
        title?: string | undefined;
        titleId?: string | undefined;
      } & React.RefAttributes<SVGSVGElement>
    >;
    skills: Skills[];
  }[];
} = {
  title: "Skills",
  sections: [
    {
      title: "Frontend",
      icon: ComputerDesktopIcon,
      skills: [
        Skills.REACT,
        Skills.VUE,
        Skills.NEXT_JS,
        Skills.REDUX,
        Skills.REACT_QUERY,
        Skills.SWIFT,
        Skills.SASS,
        Skills.TAILWIND,
        Skills.CHAKRA_UI,
      ],
    },
    {
      title: "Backend",
      icon: CircleStackIcon,
      skills: [
        Skills.NODE_JS,
        Skills.EXPRESS,
        Skills.POSTGRES,
        Skills.SOCKET_IO,
        Skills.FIREBASE,
        Skills.AWS,
        Skills.DOCKER,
      ],
    },
    {
      title: "Languages",
      icon: CodeBracketSquareIcon,
      skills: [
        Skills.TYPESCRIPT,
        Skills.JAVASCRIPT,
        Skills.JAVA,
        Skills.PYTHON,
        Skills.C,
        Skills.GIT,
      ],
    },
    {
      title: "Creative",
      icon: PaintBrushIcon,
      skills: [Skills.FIGMA, Skills.FINALCUTPRO],
    },
  ],
};
