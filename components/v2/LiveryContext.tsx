import {
  createContext,
  CSSProperties,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Team {
  id: string;
  name: string;
  color: string;
  glow: string;
}

export const teams: Team[] = [
  {
    id: "mclaren",
    name: "McLaren",
    color: "#FF8000",
    glow: "rgba(255, 128, 0, 0.4)",
  },
  {
    id: "ferrari",
    name: "Ferrari",
    color: "#E80020",
    glow: "rgba(232, 0, 32, 0.4)",
  },
  {
    id: "mercedes",
    name: "Mercedes",
    color: "#27F4D2",
    glow: "rgba(39, 244, 210, 0.4)",
  },
  {
    id: "redbull",
    name: "Red Bull",
    color: "#3671C6",
    glow: "rgba(54, 113, 198, 0.4)",
  },
];

const STORAGE_KEY = "livery";

const LiveryContext = createContext<{
  team: Team;
  setTeam: (team: Team) => void;
}>({ team: teams[0], setTeam: () => {} });

export const useLivery = () => useContext(LiveryContext);

export const LiveryProvider = ({ children }: { children: ReactNode }) => {
  const [team, setTeam] = useState(teams[0]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const match = teams.find((t) => t.id === saved);
    if (match) setTeam(match);
  }, []);

  const pickTeam = (next: Team) => {
    setTeam(next);
    localStorage.setItem(STORAGE_KEY, next.id);
  };

  return (
    <LiveryContext.Provider value={{ team, setTeam: pickTeam }}>
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
