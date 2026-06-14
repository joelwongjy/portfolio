import { Skills } from "@/constants/technologies";
import { getSvgrFromSkill } from "@/utils/skillUtils";

export const TechChip = ({ skill }: { skill: Skills }) => {
  const Svgr = getSvgrFromSkill(skill);
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-2.5 text-[11px] text-white/70">
      <span className="flex h-4 w-4 items-center justify-center [&_svg]:h-full [&_svg]:w-full">
        <Svgr />
      </span>
      {skill}
    </span>
  );
};
