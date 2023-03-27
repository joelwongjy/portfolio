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
      x: "2rem",
      transition: { duration: 0.25, type: "tween" },
    },
  };

  const buttonMotion: Variants = {
    hover: {
      borderColor: "rgb(165 180 252)",
      transition: { duration: 0.25, type: "tween" },
    },
  };

  const isSelected = (index: number) => {
    return selectedSection === index;
  };

  console.log(selectedSection);
  return (
    <div
      className={`flex gap-4 overflow-scroll md:grid md:grid-cols-${sections.length}`}
    >
      {sections.map((section, index) => {
        return (
          <motion.button
            key={index}
            className={`${
              isSelected(index)
                ? "max-md:bg-indigo-200 max-md:dark:bg-indigo-700"
                : ""
            } mb-8 flex h-12 cursor-pointer items-center rounded-lg bg-indigo-50 p-4 text-sm font-medium dark:bg-indigo-900  md:mb-0 md:h-24 md:rounded-none md:border-b-2 md:bg-transparent md:text-xl`}
            onClick={() => setSelectedSection(index)}
            variants={buttonMotion}
            whileHover="hover"
          >
            <motion.div
              variants={textMotion}
              transition={{ duration: 0.25, type: "tween" }}
              className="flex items-center max-md:!transform-none"
            >
              <section.icon className="mr-2 h-6 text-indigo-500 dark:text-indigo-300 md:h-8" />
              {section.title}
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};
