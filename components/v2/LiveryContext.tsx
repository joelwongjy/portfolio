import {
  createContext,
  CSSProperties,
  ReactNode,
  useContext,
  useMemo,
} from "react";

export interface Team {
  id: string;
  name: string;
  color: string;
  glow: string;
  driver: string;
  code: string;
  number: string;
}

// The site runs a fixed Red Bull / Max Verstappen livery — no switcher.
export const team: Team = {
  id: "redbull",
  name: "Red Bull",
  color: "#3671C6",
  glow: "rgba(54, 113, 198, 0.45)",
  driver: "Max Verstappen",
  code: "VER",
  number: "1",
};

const LiveryContext = createContext<{ team: Team }>({ team });

export const useLivery = () => useContext(LiveryContext);

export const LiveryProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo(() => ({ team }), []);
  return (
    <LiveryContext.Provider value={value}>
      <div
        style={
          {
            "--livery": team.color,
            "--livery-glow": team.glow,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </LiveryContext.Provider>
  );
};
