// components/Header/ProfileModal.tsx
import React from "react";
import { useAppSelector } from "../../store";
import { ranks } from "../../Data";
import { formatBalance } from "./utils";
import "./Header.css";

interface Props {
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ onClose }) => {
  const user = useAppSelector((state) => state.user.user);
  const rank = useAppSelector((state) => state.game.rank);
  const balance = useAppSelector((state) => state.game.balance);

  if (!user) return null;

  return (
    <div className="profileModal">
      <h2>Profile</h2>
      <div className="profileInfo">
        <div className="infoRow">
          <img src={user.photoUrl} alt="Profile" className="infoIcon" />
          <span>{user.firstName || user.username}</span>
        </div>
        <div className="infoRow">
          <span>{rank.title}</span>
        </div>
        <div className="infoRow">
          <span>{formatBalance(balance)}</span>
        </div>
      </div>
      <button className="closeBtn" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default ProfileModal;
