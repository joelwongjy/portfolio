import { ReactElement } from "react";

const MaterialUI = (): ReactElement<void, "svg"> => {
  return (
    <svg
      className="svgr"
      viewBox="0 0 600 476.3"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 259.8V0l225 129.9v86.6L75 129.9v173.2z" fill="#00b0ff" />
      <path
        d="M225 129.9L450 0v259.8l-150 86.6-75-43.3 150-86.6v-86.6l-150 86.6z"
        fill="#00b0ff"
      />
      <path d="M225 303.1v86.6l150 86.6v-86.6z" fill="#00b0ff" />
      <path
        d="M375 476.3l225-129.9V173.2l-75 43.3v86.6l-150 86.6zm150-346.4V43.3L600 0v86.6z"
        fill="#00b0ff"
      />
    </svg>
  );
};

export default MaterialUI;
