import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { UserData } from "../../Interfaces";
import ship1 from "../../assets/img/ship.webp";
import ship2 from "../../assets/img/ship2.png";
import ship3 from "../../assets/img/ship3.png";
import ship4 from "../../assets/img/ship4.png";
import ship5 from "../../assets/img/ship5.png";
import ship6 from "../../assets/img/ship6.png";
import "./Store.css";
import { useNavigate } from "react-router-dom";

interface StoreProps {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  telegramUserId: string;
}

const ships = [
  { id: "ship1", image: ship1, name: "Default", description: "Default ship" },
  {
    id: "ship2",
    image: ship2,
    name: "Schooner",
    description: "A two-masted ship with both square and fore-and-aft sails",
  },
  {
    id: "ship3",
    image: ship3,
    name: "Brig",
    description: "A two-masted vessel with square sails on both masts",
  },
  {
    id: "ship4",
    image: ship4,
    name: "Fregate",
    description: "A multi-purpose warship, typically with three masts",
  },
  {
    id: "ship5",
    image: ship5,
    name: "Bark",
    description: "A vessel with masts rigged with diagonally placed sails",
  },
  {
    id: "ship6",
    image: ship6,
    name: "Galleon",
    description: "A large sailing ship used primarily for trade and war",
  },
];

const Store: React.FC<StoreProps> = ({ user, setUser, telegramUserId }) => {
  const navigate = useNavigate();
  const handleShipSelect = async (shipId: string) => {
    try {
      setUser((prev) => ({ ...prev, selectedShip: shipId }));
      if (telegramUserId !== "default") {
        const userDocRef = doc(db, "userData", telegramUserId);
        await setDoc(userDocRef, { selectedShip: shipId }, { merge: true });
        console.log(`Корабль ${shipId} сохранен в Firestore`);
      }
    } catch (error) {
      console.error("Ошибка при сохранении корабля:", error);
    }
    navigate("/");
  };

  return (
    <div className="ship-selector">
      <h2>Store</h2>
      <div className="ship-grid">
        {ships.map((ship) => (
          <div
            key={ship.id}
            className={`ship-item ${
              user.selectedShip === ship.id ? "selected" : ""
            }`}
            onClick={() => handleShipSelect(ship.id)}
          >
            <img src={ship.image} alt={ship.name} className="ship-image" />
            <p className="ship-name">{ship.name}</p>
            <p className="ship-description">{ship.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;
