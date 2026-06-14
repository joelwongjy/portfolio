import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

// Live race telemetry published by the Circuit while the car is on track,
// consumed by the Dynamic Island. `jobIndex` is the experience the car is
// currently passing (-1 when none), and `openJob` is the entry whose full
// dossier is open in the island.
export interface RaceState {
  active: boolean;
  corner: number;
  progress: number;
  jobIndex: number;
}

const initial: RaceState = {
  active: false,
  corner: 0,
  progress: 0,
  jobIndex: -1,
};

interface RaceValue {
  race: RaceState;
  setRace: (race: RaceState) => void;
  openJob: number | null;
  setOpenJob: (i: number | null) => void;
}

const RaceContext = createContext<RaceValue>({
  race: initial,
  setRace: () => {},
  openJob: null,
  setOpenJob: () => {},
});

export const useRace = () => useContext(RaceContext);

export const RaceProvider = ({ children }: { children: ReactNode }) => {
  const [race, setRace] = useState(initial);
  const [openJob, setOpenJob] = useState<number | null>(null);
  const value = useMemo(
    () => ({ race, setRace, openJob, setOpenJob }),
    [race, openJob]
  );
  return <RaceContext.Provider value={value}>{children}</RaceContext.Provider>;
};
