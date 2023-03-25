import React, { ReactElement } from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { hero } from "@/data/hero";
import Image from "next/image";
import profilePic from "../public/hero.jpg";
import { Button } from "./buttons/Button";

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
      className="pt-20 md:pt-6"
    >
      <div className="flex flex-col items-center md:flex-row md:items-end md:justify-between">
        <motion.div
          variants={itemUp}
          className="flex flex-col items-center md:items-start"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold flex flex-col items-center md:items-start">
            <span>Joel</span>
            <span>Wong</span>
          </h1>
          <h2 className="text-3xl md:text-5xl tracking-wide font-extralight pt-4">
            Frontend Developer
          </h2>
        </motion.div>
        <motion.div variants={itemLeft} className="w-80 mt-10 md:mt-0">
          <p className="leading-7 font-light mb-4 text-small md:text-lg text-center md:text-left">
            {hero.body}
          </p>
          <Button label="Download Resume" />
        </motion.div>
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
