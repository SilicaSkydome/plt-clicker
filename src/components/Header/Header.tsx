import React from "react";
import "./Header.css";
import Logo from "../../assets/Logo.png";
import Icon from "../../assets/Icon.png";
import Token from "../../assets/img/Token.png";

interface HeaderProps {
  balance: number;
}

function Header({ balance }: HeaderProps) {
  return (
    <div className="header">
      <div className="headerRow">
        <div className="profile">1</div>
        <div className="logo">
          <img src={Logo} alt="Logo" />
        </div>
        <div className="balance">
          <div className="balanceImg">
            <img src={Token} alt="" />
          </div>
          <div className="balanceContent">
            <div className="balanceText">Balance:</div>
            <div className="balanceAmount">{balance}</div>
          </div>
        </div>
      </div>
      <div className="headerRow headerRow2"></div>
    </div>
  );
}

export default Header;
