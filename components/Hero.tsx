import React, { ReactElement } from "react";
import { motion } from "framer-motion";
import { aboutMe } from "@/data/aboutMe";
import Image from 'next/image'
import profilePic from '../public/hero.jpg'

export const Hero = (): ReactElement<"div"> => {
  return (
    <div className="pt-48 md:pt-40">
      <div className="flex flex-col items-center md:flex-row md:items-end">
        <motion.div animate={{ }} className="md:w-2/3 flex flex-col items-center md:items-start">
          <h1 className="text-5xl md:text-7xl font-extrabold">Joel Wong</h1>
          <h2 className="text-3xl md:text-5xl font-light pt-4">Frontend Developer</h2>
        </motion.div>
        <div className="leading-7 pt-12 text-center w-2/3 md:text-lg md:w-1/3 md:text-small md:text-left">{aboutMe.body[0]}</div>
      </div>
      <Image src={profilePic} alt="Profile picture" className="mt-16 h-72 md:h-96 object-cover rounded-3xl"></Image>
    </div>
  );
};
