import { ReactElement } from "react";
import { motion, Variants } from "framer-motion";
import { Skills } from "@/constants/technologies";
import { Button } from "../buttons/Button";

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
  const isSelected = (index: number) => {
    return selectedSection === index;
  };
  const variants = {
    open: { width: 220 },
    closed: { width: 130 },
  };

  return (
    <div className="sticky bottom-0 flex gap-4 overflow-auto rounded-full bg-gray-100/70 p-2 backdrop-blur-sm dark:bg-neutral-800/70">
      {sections.map((section, index) => (
        <Button
          key={index}
          onClick={() => setSelectedSection(index)}
          label={section.title}
          animate={isSelected(index) ? "open" : "closed"}
          variants={variants}
        />
      ))}
    </div>
  );
};
