// components/Header/ProfileModal.tsx
import React from "react";
import { useAppSelector } from "../../store";
import { ranks } from "../../Data";
import { formatBalance } from "./utils";
import "./Header.css";

interface Props {
  onClose: () => void;
  ref?: any;
}

const ProfileModal: React.FC<Props> = ({ onClose, ref }) => {
  const user = useAppSelector((state) => state.user.user);
  const rank = useAppSelector((state) => state.game.rank);
  const balance = useAppSelector((state) => state.game.balance);

  if (!user) return null;

  return (
    <div className="profileModal" ref={ref}>
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
  );
};

export default ProfileModal;
