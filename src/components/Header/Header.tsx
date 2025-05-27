import React from "react";
import "./Header.css";
import Logo from "../../assets/Logo.png";
import Token from "../../assets/img/TOKEN.svg";
import { useClickAway } from "@uidotdev/usehooks";
import { Rank, UserData } from "../../Interfaces";
import ProgressBar from "../Common/ProgressBar/ProgressBar";

interface HeaderProps {
  balance: number;
  user: UserData | null;
  ranks: Rank[];
}

function Header({ user, balance, ranks }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isStoreOpen, setIsStoreOpen] = React.useState(false);

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleStoreClick = () => {
    setIsStoreOpen(!isStoreOpen);
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
          <p>Coming soon...</p>
        </div>
      </div>
    </>
  );
}

export default Header;
