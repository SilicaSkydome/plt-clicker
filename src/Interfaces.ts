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
