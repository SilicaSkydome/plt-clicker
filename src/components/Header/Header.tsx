import React from "react";
import "./Header.css";
import Logo from "../../assets/Logo.png";
import Token from "../../assets/img/Token.png";
import { useClickAway } from "@uidotdev/usehooks";

interface userData {
  id: string;
  firstName: string;
  username: string;
  lastInteraction: string;
  photoUrl: string;
}

interface HeaderProps {
  balance: number;
  user: userData | null;
}

function Header({ balance, user }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const ref = useClickAway(() => {
    setIsOpen(false);
  });

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
            <div className="balanceText">Balance:</div>
            <div className="balanceAmount">{balance.toFixed(2)}</div>
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
          <h3>Captain</h3>
        </div>
        <div className="seaCount">You have opened 4 seas</div>
        <div className="tillNext">Until the next sea is left:</div>
      </div>
    </div>
  );
}

export default Header;
