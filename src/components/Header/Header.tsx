// components/Header/Header.tsx
import React from "react";
import "./Header.css";
import { useAppSelector } from "../../store";
import { formatBalance } from "./utils";
import { useHeaderLogic } from "./useHeaderLogic";
import ProfileModal from "./ProfileModal";
import BankModal from "./BankModal";

import bankIcon from "../../assets/img/TOKEN.svg";
import mapIcon from "../../assets/img/Compass.svg";

const Header = () => {
  const user = useAppSelector((state) => state.user.user);
  const balance = useAppSelector((state) => state.game.balance);
  const rank = useAppSelector((state) => state.game.rank);

  const { showProfile, showBank, toggleProfile, toggleBank, goToMap } =
    useHeaderLogic();

  if (!user) return null;

  return (
    <div className="header">
      <div className="headerRow">
        <div className="headerItem profile" onClick={toggleProfile}>
          <img
            src={user.photoUrl}
            alt="Profile"
            className="headerIcon profilePicture"
          />
        </div>
        <div className="headerItem compass" onClick={goToMap}>
          <img src={mapIcon} alt="Map" className="headerIcon" />
        </div>
        <div className="headerItem balance" onClick={toggleBank}>
          <img src={bankIcon} alt="Bank" className="headerIcon" />
          <span className="headerText">{formatBalance(balance)}</span>
        </div>

        {showProfile && <ProfileModal onClose={toggleProfile} />}
        {showBank && <BankModal onClose={toggleBank} />}
      </div>
    </div>
  );
};

export default Header;
