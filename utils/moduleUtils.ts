import { moduleMapping } from "@/constants/modules";

export const getModuleNameFromCode = (moduleCode: string): string => {
  return moduleMapping[moduleCode.toUpperCase()] ?? "";
};