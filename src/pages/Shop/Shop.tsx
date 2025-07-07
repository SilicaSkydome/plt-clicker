import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { ShopProps, UserData } from "../../Interfaces";
import { ships } from "../../Data";
import "./Shop.css";
import { useNavigate } from "react-router-dom";

const Shop: React.FC<ShopProps> = ({ user, setUser, telegramUserId }) => {
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
          >
            <img src={ship.image} alt={ship.name} className="ship-image" />
            <p className="ship-name">{ship.name}</p>
            <p className="ship-description">{ship.description}</p>
            <p className="ship-condition">{ship.condition}</p>

            {user.selectedShip === ship.id ? (
              <button className="ship-button" disabled>
                Selected
              </button>
            ) : (
              <button
                className="ship-button"
                onClick={() => handleShipSelect(ship.id)}
              >
                Buy for {ship.price} Gold
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
