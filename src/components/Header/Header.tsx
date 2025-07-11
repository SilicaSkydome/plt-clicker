// components/Header/Header.tsx
import React, { useEffect } from "react";
import "./Header.css";
import { useAppDispatch, useAppSelector } from "../../store";
import { formatBalance } from "./utils";
import { useHeaderLogic } from "./useHeaderLogic";
import ProfileModal from "./ProfileModal";
import BankModal from "./BankModal";

import bankIcon from "../../assets/img/TOKEN.svg";
import mapIcon from "../../assets/img/Compass.svg";
import { useClickAway } from "@uidotdev/usehooks";
import { updateBalance } from "../../store/gameSlice";

const Header = () => {
  const user = useAppSelector((state) => state.user.user);
  const balance = useAppSelector((state) => state.game.balance);
  const rank = useAppSelector((state) => state.game.rank);

  const {
    showProfile,
    showBank,
    toggleProfile,
    toggleBank,
    goToMap,
    closeProfile,
    closeBank,
  } = useHeaderLogic();

  const profileRef = useClickAway(() => {
    closeProfile();
  });
  const bankRef = useClickAway(() => {
    closeBank();
  });

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
        <div className="headerItem balance">
          <img
            src={bankIcon}
            alt="Bank"
            className="headerIcon"
            onClick={toggleBank}
          />
          <span className="headerText">{formatBalance(balance)}</span>
        </div>
      </div>
      {showProfile && <ProfileModal onClose={toggleProfile} ref={profileRef} />}
      {showBank && <BankModal onClose={toggleBank} ref={bankRef} />}
    </div>
  );
};

export default Header;
