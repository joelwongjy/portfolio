import React, { ReactElement } from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { aboutMe } from "@/data/aboutMe";
import Image from "next/image";
import profilePic from "../public/hero.jpg";

export const Hero = (): ReactElement<"div"> => {
  const itemUp: Variants = {
    hidden: { opacity: 0, y: 300 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "tween",
        duration: 0.8,
        ease: easeOut,
      },
    },
  };

  const itemHalfUp: Variants = {
    hidden: { opacity: 0, y: 100 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.5,
        type: "tween",
        duration: 0.8,
        ease: easeOut,
      },
    },
  };

  const itemLeft: Variants = {
    hidden: { opacity: 0, x: 300 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.5,
        type: "tween",
        duration: 1,
        ease: easeOut,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.8 }}
      className="pt-20 md:pt-12"
    >
      <div className="flex flex-col items-center md:flex-row md:items-end">
        <motion.div
          variants={itemUp}
          className="md:w-2/3 flex flex-col items-center md:items-start"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold">Joel Wong</h1>
          <h2 className="text-3xl md:text-5xl tracking-wide font-extralight pt-4">
            Frontend Developer
          </h2>
        </motion.div>
        <motion.p
          variants={itemLeft}
          className="leading-7 pt-12 text-center font-light w-2/3 md:text-lg md:w-1/3 md:text-small md:text-left"
        >
          {aboutMe.body[0]}
        </motion.p>
      </div>
      <motion.div variants={itemHalfUp}>
        <Image
          src={profilePic}
          alt="Profile picture"
          className="mt-16 h-72 md:h-96 object-cover rounded-3xl"
        ></Image>
      </motion.div>
    </motion.div>
  );
};
