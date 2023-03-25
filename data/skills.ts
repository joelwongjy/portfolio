import { Skills } from "@/constants/technologies";
import {
  CircleStackIcon,
  CodeBracketSquareIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/solid";

export const skills: {
  title: string;
  sections: {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    skills: Skills[];
  }[];
} = {
  title: "skills",
  sections: [
    {
      title: "Frontend",
      icon: ComputerDesktopIcon,
      skills: [
        Skills.REACT,
        Skills.REDUX,
        Skills.SWIFT,
        Skills.NEXT_JS,
        Skills.VUE,
        Skills.TYPESCRIPT,
        Skills.SASS,
        Skills.TAILWIND,
      ],
    },
    {
      title: "Backend",
      icon: CircleStackIcon,
      skills: [
        Skills.NODE_JS,
        Skills.POSTGRES,
        Skills.EXPRESS,
        Skills.FIREBASE,
        Skills.LARAVEL,
        Skills.DOCKER,
        Skills.TYPESCRIPT,
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
