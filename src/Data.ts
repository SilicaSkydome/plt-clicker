import { Location, Rank, Task, UserData } from "./Interfaces";
import ship1 from "./assets/img/ships/ship1.png";
import ship2 from "./assets/img/ships/ship2.png";
import ship3 from "./assets/img/ships/ship3.png";
import ship4 from "./assets/img/ships/ship4.png";
import ship5 from "./assets/img/ships/ship5.png";
import ship6 from "./assets/img/ships/ship6.png";
import commonChest from "./assets/img/Chests/chestPlaceholder.webp";
// import rareChest from "./assets/img/Chests/rareShip.png";
import ring1 from "./assets/img/circles/1.png";
import ring2 from "./assets/img/circles/2.png";
import ring3 from "./assets/img/circles/3.png";
import ring4 from "./assets/img/circles/4.png";
import ring5 from "./assets/img/circles/5.png";
import ring6 from "./assets/img/circles/6.png";
import ring7 from "./assets/img/circles/7.png";
import ring8 from "./assets/img/circles/8.png";
import ring9 from "./assets/img/circles/9.png";

const locations: Location[] = [
  {
    id: "1stSea",
    name: "1-ST SEA",
    x: 100,
    y: 100,
    unlocked: true,
    cost: 0,
    minRank: 1,
    image: "sea1",
  },
  {
    id: "2ndSea",
    name: "2-ST SEA",
    x: 420 - 130,
    y: 130,
    unlocked: false,
    cost: 50,
    minRank: 2,
    image: "sea2",
  },
  {
    id: "3rdSea",
    name: "3-RD SEA",
    x: 420 - 130,
    y: 280,
    unlocked: false,
    cost: 100,
    minRank: 3,
    image: "sea3",
  },
  {
    id: "4thSea",
    name: "4-TH SEA",
    x: 70,
    y: 370,
    unlocked: false,
    cost: 150,
    minRank: 4,
    image: "sea4",
  },
  {
    id: "5thSea",
    name: "5-TH SEA",
    x: 420 - 170,
    y: 400,
    unlocked: false,
    cost: 200,
    minRank: 5,
    image: "sea5",
  },
  {
    id: "6thSea",
    name: "6-TH SEA",
    x: 100,
    y: 520,
    unlocked: false,
    cost: 250,
    minRank: 6,
    image: "sea6",
  },
  {
    id: "7thSea",
    name: "7-TH SEA",
    x: 420 - 130,
    y: 550,
    unlocked: false,
    cost: 300,
    minRank: 7,
    image: "sea7",
  },
];

const ships = [
  {
    id: "ship1",
    image: ship1,
    name: "Default",
    description: "Default ship",
    condition: "Available for all users",
    price: 0,
  },
  {
    id: "ship2",
    image: ship2,
    name: "Schooner",
    description: "A two-masted ship with both square and fore-and-aft sails",
    condition: "Available for all users",
    price: 0,
  },
  {
    id: "ship3",
    image: ship3,
    name: "Brig",
    description: "A two-masted vessel with square sails on both masts",
    condition: "Available for all users",
    price: 0,
  },
  {
    id: "ship4",
    image: ship4,
    name: "Fregate",
    description: "A multi-purpose warship, typically with three masts",
    condition: "Available for all users",
    price: 0,
  },
  {
    id: "ship5",
    image: ship5,
    name: "Bark",
    description: "A vessel with masts rigged with diagonally placed sails",
    condition: "Available for all users",
    price: 0,
  },
  {
    id: "ship6",
    image: ship6,
    name: "Galleon",
    description: "A large sailing ship used primarily for trade and war",
    condition: "Available for all users",
    price: 0,
  },
];
const chests = [
  { id: "common", image: commonChest },
  // { id: "rare", image: rareChest },
];
const rings = [
  { id: "ring1", image: ring1 },
  { id: "ring2", image: ring2 },
  { id: "ring3", image: ring3 },
  { id: "ring4", image: ring4 },
  { id: "ring5", image: ring5 },
  { id: "ring6", image: ring6 },
  { id: "ring7", image: ring7 },
  { id: "ring8", image: ring8 },
  { id: "ring9", image: ring9 },
];
// Определяем ранги
const ranks: Rank[] = [
  {
    title: "Cabin Boy",
    pirateTitle: "Cabin Boy",
    goldMin: 0,
    goldMax: 999,
    clickBonus: 0,
    goldPerClick: 0.035,
    level: 1,
    estimatedDays: 0,
  },
  {
    title: "Sailor",
    pirateTitle: "Sailor Saltbeard",
    goldMin: 1000,
    goldMax: 4999,
    clickBonus: 0.03,
    goldPerClick: 0.065,
    level: 1,
    estimatedDays: 3.3,
  },
  {
    title: "Quartermaster",
    pirateTitle: "Quartermaster Hookhand",
    goldMin: 5000,
    goldMax: 9999,
    clickBonus: 0.06,
    goldPerClick: 0.095,
    level: 3,
    estimatedDays: 10.4,
  },
  {
    title: "First Mate",
    pirateTitle: "First Mate Deadeye",
    goldMin: 10000,
    goldMax: 29999,
    clickBonus: 0.09,
    goldPerClick: 0.125,
    level: 5,
    estimatedDays: 15.9,
  },
  {
    title: "Captain",
    pirateTitle: "Captain Blackbeard",
    goldMin: 30000,
    goldMax: null,
    clickBonus: 0.12,
    goldPerClick: 0.195,
    level: 15,
    estimatedDays: 31.9,
  },
];

// Определяем начальный список задач
const initialTasks: Task[] = [
  {
    icon: "./assets/Quest1.png",
    title: "Subscribe to Telegram",
    description: "+50 PLGold",
    button: "",
    points: 50,
    completed: false,
    action: (balance: number, setBalance: (value: number) => void) => {
      //@ts-ignore
      if (window.Telegram?.WebApp) {
        //@ts-ignore
        window.Telegram.WebApp.openLink("https://t.me/PirateLife1721");
      } else {
        window.open("https://t.me/PirateLife1721", "_blank");
      }
      return true;
    },
  },
  {
    icon: "./assets/Quest2.png",
    title: "Invite 5 friends",
    description: "+250 PLGold",
    button: "",
    points: 250,
    completed: false,
    action: (
      balance: number,
      setBalance: (value: number) => void,
      user: UserData | null,
      navigate: (path: string) => void
    ) => {
      if (user) {
        if (user.referals && user.referals?.length < 5) {
          navigate("/invite");
          return false;
        } else if (user.referals && user.referals?.length >= 5) {
          return true;
        } else {
          navigate("/invite");
          return false;
        }
      }
      return false;
    },
  },
  {
    icon: "./assets/Quest3.png",
    title: "Join instagram",
    description: "+50 PLGold",
    button: "",
    points: 50,
    completed: false,
    action: (balance: number, setBalance: (value: number) => void) => {
      window.open("https://www.instagram.com/piratelife_official/", "_blank");
      return true;
    },
  },
];

export { locations, ships, chests, rings, ranks, initialTasks };
