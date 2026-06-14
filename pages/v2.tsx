import Head from "next/head";
import { useEffect } from "react";

import { Circuit3D } from "@/components/v2/Circuit3D";
import { HeroV2 } from "@/components/v2/HeroV2";
import { IslandNav } from "@/components/v2/IslandNav";
import { LiveryProvider } from "@/components/v2/LiveryContext";
import { PitLane } from "@/components/v2/PitLane";
import { Podium } from "@/components/v2/Podium";
import { RaceProvider } from "@/components/v2/RaceContext";

export default function RaceWeekend() {
  useEffect(() => {
    document.body.classList.add("v2");
    document.documentElement.classList.add("scroll-smooth");
    return () => {
      document.body.classList.remove("v2");
      document.documentElement.classList.remove("scroll-smooth");
    };
  }, []);

  return (
    <>
      <Head>
        <title>Joel Wong</title>
        <meta
          name="description"
          content="Joel Wong. Frontend engineer, F1 fan. It's lights out and away we go."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050505" />
      </Head>
      <LiveryProvider>
        <RaceProvider>
          <div className="min-h-screen overflow-x-clip bg-[#050505] text-white">
            <IslandNav />
            <main>
              <HeroV2 />
              <Circuit3D />
              <PitLane />
              <Podium />
            </main>
            <footer className="pb-10 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
              <p>© {new Date().getFullYear()} Joel Wong</p>
            </footer>
          </div>
        </RaceProvider>
      </LiveryProvider>
    </>
  );
}
