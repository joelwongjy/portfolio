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
      <div className="flex flex-col md:flex-row md:justify-between">
        <motion.div variants={itemUp} className="flex flex-col ">
          <h1 className="flex flex-col text-6xl font-extrabold md:text-7xl">
            <span>Joel</span>
            <span>Wong</span>
          </h1>
          <h2 className="pt-4 text-3xl font-extralight tracking-wide md:text-5xl">
            Frontend Developer
          </h2>
        </motion.div>
        <motion.div variants={itemLeft} className="mt-10 w-80 md:mt-0">
          <p className="text-small mb-4 font-light leading-7 md:text-left md:text-lg">
            {hero.body}
          </p>
          <Button label="Download Resume" />
        </motion.div>
      </div>
      <motion.div variants={itemHalfUp}>
        <Image
          src={profilePic}
          alt="Profile picture"
          className="mt-16 h-72 rounded-3xl object-cover md:h-96"
        ></Image>
      </motion.div>
    </motion.div>
  );
};
