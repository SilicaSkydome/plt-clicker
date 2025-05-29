import React from "react";
import "./Header.css";
import Logo from "../../assets/Logo.png";
import Token from "../../assets/img/TOKEN.svg";
import { useClickAway } from "@uidotdev/usehooks";
import { Rank, UserData } from "../../Interfaces";
import ProgressBar from "../Common/ProgressBar/ProgressBar";
import { db } from "../../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import ship1 from "../../assets/img/ship.webp";
import ship2 from "../../assets/img/ship2.png";
import ship3 from "../../assets/img/ship3.png";
import ship4 from "../../assets/img/ship4.png";
import ship5 from "../../assets/img/ship5.png";
import ship6 from "../../assets/img/ship6.png";

interface HeaderProps {
  balance: number;
  user: UserData | null;
  ranks: Rank[];
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}

// Список доступных кораблей
const ships = [
  { id: "ship1", name: "Default", image: ship1 },
  { id: "ship2", name: "Schooner", image: ship2 },
  { id: "ship3", name: "Brig", image: ship3 },
  { id: "ship4", name: "Fregate", image: ship4 },
  { id: "ship5", name: "Bark", image: ship5 },
  { id: "ship6", name: "Galleon", image: ship6 },
];

function Header({ user, balance, ranks, setUser }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isStoreOpen, setIsStoreOpen] = React.useState(false);
  const isTestMode = false;

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleStoreClick = () => {
    setIsStoreOpen(!isStoreOpen);
  };

  // Функция выбора корабля
  const handleShipSelect = async (shipId: string) => {
    if (!user?.id) return;

    try {
      if (isTestMode) {
        // В тестовом режиме обновляем только локальное состояние
        console.log(`Тестовый режим: Выбран корабль ${shipId}`);
        setUser((prev) => ({ ...prev, selectedShip: shipId }));
      } else {
        // В обычном режиме сохраняем в Firestore
        const userDocRef = doc(db, "userData", user.id);
        await updateDoc(userDocRef, { selectedShip: shipId });
        setUser((prev) => ({ ...prev, selectedShip: shipId }));
      }
      setIsStoreOpen(false);
    } catch (error) {
      console.error("Ошибка при сохранении корабля:", error);
    }
  };

  const profileRef = useClickAway(() => {
    setIsProfileOpen(false);
  });
  const storeRef = useClickAway(() => {
    setIsStoreOpen(false);
  });

  const formatBalance = (balance: number | null): string => {
    if (balance === null) return "Загрузка...";

    const absBalance = Math.abs(balance);
    const sign = balance < 0 ? "-" : "";

    if (absBalance >= 1_000_000_000_000) {
      return `${sign}${(balance / 1_000_000_000_000).toFixed(2)}T`;
    } else if (absBalance >= 1_000_000_000) {
      return `${sign}${(balance / 1_000_000_000).toFixed(2)}B`;
    } else if (absBalance >= 1_000_000) {
      return `${sign}${(balance / 1_000_000).toFixed(2)}M`;
    } else if (absBalance >= 1_000) {
      return `${sign}${(balance / 1_000).toFixed(2)}k`;
    } else {
      return balance.toFixed(2);
    }
  };

  return (
    <>
      <div className="header">
        <div className="headerRow">
          <div className="profile" onClick={() => handleProfileClick()}>
            <div className="profilePicture">
              <img src={user?.photoUrl} alt="avatar" />
            </div>
          </div>
          <div className="compass">
            {user?.rank && (
              <ProgressBar
                balance={balance}
                currentRank={user.rank}
                ranks={ranks || []}
              />
            )}
          </div>
          <div className="balance" onClick={() => handleStoreClick()}>
            <div className="balanceImg">
              <img src={Token} alt="" />
            </div>
            <div className="balanceContent">
              Balance
              <div className="balanceAmount">{formatBalance(balance)}</div>
            </div>
          </div>
        </div>
        {isTestMode && (
          <div
            className="testModeIndicator"
            style={{ color: "red", textAlign: "center" }}
          >
            Тестовый оффлайн-режим
          </div>
        )}
      </div>

      <div
        //@ts-ignore
        ref={profileRef}
        className={`profileModal ${isProfileOpen ? "isOpen" : ""}`}
      >
        <h1>Profile</h1>
        <div className="avatar">
          <img src={user?.photoUrl} alt="avatar" />
        </div>
        <h2>{user?.username}</h2>
        <div className="profileModalRank">
          <p>Your rank:</p>
          <h3>{user?.rank?.title}</h3>
        </div>
        <div className="seaCount">You have opened 4 seas</div>
        <div className="tillNext">Until the next sea is left:</div>
      </div>
      <div
        //@ts-ignore
        ref={storeRef}
        className={`storeModal ${isStoreOpen ? "isOpen" : ""}`}
      >
        <h1>Store</h1>
        <div className="storeContent">
          <h2>Choose your ship</h2>
          <div className="shipsList" style={{ display: "flex", gap: "10px" }}>
            {ships.map((ship) => (
              <div
                key={ship.id}
                className="shipItem"
                onClick={() => handleShipSelect(ship.id)}
                style={{
                  cursor: "pointer",
                  border:
                    user?.selectedShip === ship.id
                      ? "2px solid gold"
                      : "2px solid transparent",
                  padding: "5px",
                }}
              >
                <img src={ship.image} alt={ship.name} />
                <p>{ship.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
