import React from "react";
import "./Header.css";
import Logo from "../../assets/Logo.png";
import Token from "../../assets/img/Token.png";
import { useClickAway } from "@uidotdev/usehooks";
import { UserData } from "../../Interfaces";

interface HeaderProps {
  balance: number;
  user: UserData | null;
}

function Header({ user, balance }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const ref = useClickAway(() => {
    setIsOpen(false);
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
    <div className="header">
      <div className="headerRow">
        <div className="profile" onClick={() => handleProfileClick()}>
          <div className="profilePicture">
            <img src={user?.photoUrl} alt="avatar" />
          </div>
        </div>
        <div className="logo">
          <img src={Logo} alt="Logo" />
        </div>
        <div className="balance">
          <div className="balanceImg">
            <img src={Token} alt="" />
          </div>
          <div className="balanceContent">
            <div className="balanceText">
              <div className="balanceAmount">{formatBalance(balance)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="headerRow headerRow2"></div>
      {/* 
      // @ts-ignore */}
      <div ref={ref} className={`profileModal ${isOpen ? "isOpen" : ""}`}>
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
    </div>
  );
}

export default Header;
