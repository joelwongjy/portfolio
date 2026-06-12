import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

import { Circuit } from "@/components/v2/Circuit";
import { HeroV2 } from "@/components/v2/HeroV2";
import { IslandNav } from "@/components/v2/IslandNav";
import { LightsOut } from "@/components/v2/LightsOut";
import { LiveryProvider } from "@/components/v2/LiveryContext";
import { Podium } from "@/components/v2/Podium";

export default function RaceWeekend() {
  const [started, setStarted] = useState(false);
  const handleLightsOut = useCallback(() => setStarted(true), []);

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
        <title>Joel Wong — Race Weekend</title>
        <meta
          name="description"
          content="Joel Wong. Frontend engineer, F1 fan. It's lights out and away we go."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050505" />
      </Head>
      <LiveryProvider>
        <div className="min-h-screen bg-[#050505] text-white">
          {!started && <LightsOut onDone={handleLightsOut} />}
          <IslandNav />
          <main>
            <HeroV2 started={started} />
            <Circuit />
            <Podium />
          </main>
          <footer className="pb-10 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
            <p>Joel Wong · Race Weekend prototype</p>
          </footer>
        </div>
      </LiveryProvider>
    </>
  );
}
