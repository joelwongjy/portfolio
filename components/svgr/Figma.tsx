import { ReactElement } from "react";

export const Figma = (): ReactElement<void, "svg"> => {
  return (
    <svg className="svgr" viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 118 0 4 4 0 01-8 0zm-8 8a4 4 0 014-4h4v4a4 4 0 11-8 0zm8-20v8h4a4 4 0 100-8h-4zM4 4a4 4 0 004 4h4V0H8a4 4 0 00-4 4zm0 8a4 4 0 004 4h4V8H8a4 4 0 00-4 4z" />
    </svg>
  );
};
