import { ReactElement } from "react";
import { motion, Variants } from "framer-motion";
import { Skills } from "@/constants/technologies";

interface SkillNavbarProps {
  sections: {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    skills: Skills[];
  }[];
  selectedSection: number;
  setSelectedSection: (index: number) => void;
}

export const SkillNavbar = ({
  sections,
  selectedSection,
  setSelectedSection,
}: SkillNavbarProps): ReactElement<SkillNavbarProps, "div"> => {
  const textMotion: Variants = {
    hover: {
      x: 20,
      transition: { duration: 0.25, type: "tween" },
    },
  };

  const buttonMotion: Variants = {
    hover: {
      borderColor: "rgb(165 180 252)",
      transition: { duration: 0.25, type: "tween" },
    },
  };

  return (
    <div className={`flex overflow-scroll gap-4 md:grid md:grid-cols-${sections.length}`}>
      {sections.map((section, index) => {
        return (
          <motion.button
            key={index}
            className="cursor-pointer h-12 bg-indigo-100 max-md:hover:bg-indigo-50 dark:bg-indigo-900 max-md:hover:dark:bg-indigo-700 p-4 rounded-lg md:bg-transparent md:rounded-none md:h-24 mb-8 md:mb-0 md:border-b-2 text-sm md:text-xl font-medium flex items-center"
            onClick={() => setSelectedSection(index)}
            variants={buttonMotion}
            whileHover="hover"
          >
            <motion.div variants={textMotion} className="flex items-center max-md:!transform-none">
              <section.icon className="h-6 md:h-8 text-indigo-300 mr-2" />
              {section.title}
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};
