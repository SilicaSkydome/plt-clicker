// components/Header/BankModal.tsx
import React from "react";
import { useAppSelector } from "../../store";
import { formatBalance } from "./utils";
import "./Header.css";

interface Props {
  onClose: () => void;
  ref?: any;
}

const BankModal: React.FC<Props> = ({ onClose, ref }) => {
  const balance = useAppSelector((state) => state.game.balance);

  return (
    <div className="bankModal" ref={ref}>
      <h2>Your Wallet</h2>
      <p className="walletBalance">{formatBalance(balance)}</p>
      <p className="walletNote">Gold coins are earned while playing</p>
      <button className="closeBtn" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default BankModal;
