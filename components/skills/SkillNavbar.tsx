import { ReactElement } from "react";
import { motion, Variants } from "framer-motion";
import { Skills } from "@/constants/technologies";

interface SkillNavbarProps {
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

  return (
    <div
      className={`flex gap-2 overflow-auto lg:grid lg:grid-cols-${sections.length}`}
    >
      {sections.map((section, index) => {
        return (
          <motion.button
            key={index}
            className={`${
              isSelected(index) &&
              "max-lg:bg-indigo-200 max-lg:dark:bg-indigo-700"
            } mb-8 flex h-12 cursor-pointer items-center rounded-lg bg-indigo-50 p-4 text-sm font-medium dark:bg-indigo-900 lg:mb-0 lg:h-20 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:text-xl`}
            onClick={() => setSelectedSection(index)}
            variants={buttonMotion}
            whileHover="hover"
          >
            <motion.div
              variants={textMotion}
              transition={{ duration: 0.25, type: "tween" }}
              className="flex items-center max-lg:!transform-none"
            >
              <section.icon className="mr-2 h-6 text-indigo-700 dark:text-indigo-300 lg:h-8" />
              {section.title}
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};
