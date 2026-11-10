import Head from "next/head";
import { useEffect } from "react";

import { BroadcastApp } from "@/components/v2/broadcast/BroadcastApp";
import { LiveryProvider } from "@/components/v2/LiveryContext";

// The site as a race broadcast over a lap of Monaco built from real map
// data: the grid introduces me, Max Verstappen's 2023 pole lap carries my
// experience (one job per corner, on the trackside boards) and the pit
// garages hold my side projects.
export const RaceWeekend = () => {
  useEffect(() => {
    document.body.classList.add("map-app");
    return () => document.body.classList.remove("map-app");
  }, []);

  return (
    <>
      <Head>
        <title>Joel Wong</title>
        <meta
          name="description"
          content="Joel Wong is a frontend engineer at TikTok. Previously at Kisi, Propel and Shopee."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#DCE6EC" />
        <link rel="preload" href="/monaco/scene.json" as="fetch" crossOrigin="anonymous" />
      </Head>
      <LiveryProvider>
        <BroadcastApp />
      </LiveryProvider>
    </>
  );
};
