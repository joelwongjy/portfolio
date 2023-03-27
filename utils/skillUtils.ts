import * as skills from "@/components/svgr";
import { Skills } from "@/constants/technologies";

export const getSvgrFromSkill = (
  skill: Skills
): (() => React.ReactElement<void, "svg">) => {
  switch (skill) {
    case Skills.BULMA:
      return skills.Bulma;
    case Skills.C:
      return skills.C;
    case Skills.DOCKER:
      return skills.Docker;
    case Skills.EXPRESS:
      return skills.Express;
    case Skills.FIGMA:
      return skills.Figma;
    case Skills.FINALCUTPRO:
      return skills.FinalCutPro;
    case Skills.FIREBASE:
      return skills.Firebase;
    case Skills.FLUTTER:
      return skills.Flutter;
    case Skills.GIT:
      return skills.Git;
    case Skills.GITHUB:
      return skills.GitHub;
    case Skills.GITLAB:
      return skills.GitLab;
    case Skills.JAVA:
      return skills.Java;
    case Skills.JAVASCRIPT:
      return skills.JavaScript;
    case Skills.LARAVEL:
      return skills.Laravel;
    case Skills.MATERIAL_UI:
      return skills.MaterialUI;
    case Skills.MYSQL:
      return skills.MySQL;
    case Skills.NEXT_JS:
      return skills.NextJS;
    case Skills.NODE_JS:
      return skills.Node;
    case Skills.POSTGRES:
      return skills.Postgres;
    case Skills.PYTHON:
      return skills.Python;
    case Skills.REACT:
      return skills.ReactIcon;
    case Skills.REDUX:
      return skills.Redux;
    case Skills.SALESFORCE:
      return skills.Salesforce;
    case Skills.SASS:
      return skills.Sass;
    case Skills.SWIFT:
      return skills.Swift;
    case Skills.TAILWIND:
      return skills.Tailwind;
    case Skills.TYPESCRIPT:
      return skills.TypeScript;
    case Skills.VUE:
      return skills.Vue;
    default:
      throw new Error();
  }
};
