import { createContext, ReactNode, useContext, useState } from "react";

// Live race telemetry published by the Circuit while the car is on track,
// consumed by the Dynamic Island.
export interface RaceState {
  active: boolean;
  corner: number;
  progress: number;
}

const initial: RaceState = { active: false, corner: 0, progress: 0 };

const RaceContext = createContext<{
  race: RaceState;
  setRace: (race: RaceState) => void;
}>({ race: initial, setRace: () => {} });

export const useRace = () => useContext(RaceContext);

export const RaceProvider = ({ children }: { children: ReactNode }) => {
  const [race, setRace] = useState(initial);
  return (
    <RaceContext.Provider value={{ race, setRace }}>
      {children}
    </RaceContext.Provider>
  );
};
