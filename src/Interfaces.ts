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

export interface UserData {
  id: string;
  firstName: string;
  username: string;
  lastInteraction: string;
  photoUrl: string;
  balance: number;
  tasks: TaskData[]; // Храним только сериализуемые данные
  referals?: Referal[];
}
