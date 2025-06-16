// Интерфейс для данных задач, которые хранятся в Firestore (без функции action)
export interface TaskData {
  icon: string;
  title: string;
  description: string;
  button: string;
  points: number;
  completed: boolean;
}

// Интерфейс для задач в приложении (с функцией action)
export interface Task extends TaskData {
  action: (
    balance: number,
    setBalance: (newBalance: number) => void,
    user: any,
    navigate: (path: string) => void
  ) => boolean;
}

export interface Referal {
  id: string;
}

// Интерфейс для ранга
export interface Rank {
  title: string;
  pirateTitle: string;
  goldMin: number;
  goldMax: number | null; // null для последнего ранга (бесконечность)
  clickBonus: number;
  goldPerClick: number;
  level: number;
  estimatedDays: number;
}

export interface UserData {
  id: string;
  firstName: string;
  username: string;
  lastInteraction: string;
  photoUrl: string;
  balance: number;
  tasks: TaskData[];
  referals?: Referal[];
  rank?: Rank;
  energy: number;
  lastEnergyUpdate: number;
  selectedShip?: string; // Добавляем поле для выбранного корабля
  location: string;
}
export interface Location {
  id: string;
  name: string;
  x: number;
  y: number;
  unlocked: boolean;
  cost: number;
  minRank: number;
  image: string;
}

export interface ChestData {
  x: number;
  y: number;
  id: number;
  lastSpawnTime: number | null;
  userId: string;
}

export interface ClickEvent {
  type: "boat" | "chest";
  points: number;
  chestId?: number;
  energyAtClick?: number;
}

export interface playerRank {
  rank: number;
  title: string;
  name: string;
  balance: number;
  avatar: string;
}

export interface FriendData {
  id: string;
  name: string;
  photoUrl?: string | null;
  rank?: Rank | null;
}

//Props
export interface AppContentProps {
  user: UserData;
  isLoading: boolean;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  currentRank: Rank;
  initialEnergy: number;
  initialLastEnergyUpdate: number;
  saveEnergy: (newEnergy: number, updateTime: number) => Promise<void>;
  maxEnergy: number;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  location: string;
}

export interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
}

export interface ProgressBarProps {
  balance: number; // Текущий баланс игрока
  currentRank: Rank; // Текущий ранг игрока
  ranks: Rank[]; // Массив всех рангов
}

export interface EarnProps {
  user: UserData;
  balance: number;
  setBalance: (balance: number) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export interface InviteProps {
  user: UserData;
}

export interface MapProps {
  location: string;
  setLocation: (location: string) => void;
}

export interface StoreProps {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  telegramUserId: string;
}

export interface HeaderProps {
  balance: number;
  user: UserData | null;
  ranks: Rank[];
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}

export interface GameProps {
  user: UserData;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  currentRank: Rank;
  ranks: Array<Rank>;
  initialEnergy: number;
  initialLastEnergyUpdate: number;
  saveEnergy: (newEnergy: number, updateTime: number) => Promise<void>;
  maxEnergy: number;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}
