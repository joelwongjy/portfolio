import { ReactElement } from "react";

import { getModuleNameFromCode } from "@/utils/moduleUtils";

interface ModuleCodeProps {
  moduleCode: string;
  moduleName?: string;
}

const ModuleCode = (
  props: ModuleCodeProps
): ReactElement<ModuleCodeProps, "div"> => {
  const { moduleCode } = props;

  const moduleName = getModuleNameFromCode(moduleCode);

  return (
    <div className="group flex flex-row items-center justify-center">
      <p>{moduleCode}</p>
      <p className="font-sm absolute mt-8 text-xs text-gray-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-gray-200">
        {moduleName}
      </p>
    </div>
  );
};

export default ModuleCode;
