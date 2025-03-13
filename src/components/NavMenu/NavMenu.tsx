import React from "react";
import "./NavMenu.css";
import { NavLink } from "react-router-dom";

function NavMenu() {
  return (
    <div className="nav-menu">
      <NavLink to="/">Game</NavLink>
      <NavLink to="/stats">Stats</NavLink>
      <NavLink to="/invite">Invite</NavLink>
      <NavLink to="/earn">Earn</NavLink>
    </div>
  );
}

export default NavMenu;
