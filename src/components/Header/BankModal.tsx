import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store";
import { formatBalance } from "./utils";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { updateBalance } from "../../store/gameSlice";
import "./Header.css";

interface Props {
  onClose: () => void;
  ref?: any;
}

interface DonationOption {
  currency: string;
  amount: number;
  gold: number;
}

const BankModal: React.FC<Props> = ({ onClose, ref }) => {
  const dispatch = useAppDispatch();
  const balance = useAppSelector((state) => state.game.balance);
  const [tonConnectUI] = useTonConnectUI();
  const [error, setError] = useState<string | null>(null);

  const donationOptions: DonationOption[] = [
    { currency: "USDT", amount: 1, gold: 100 },
    { currency: "USDT", amount: 5, gold: 500 },
    { currency: "USDT", amount: 10, gold: 1000 },
    { currency: "TON", amount: 1, gold: 80 },
    { currency: "TON", amount: 5, gold: 400 },
    { currency: "JETTON", amount: 20, gold: 1500 },
  ];

  const handleDonate = async (option: DonationOption) => {
    try {
      if (!tonConnectUI.connected) {
        setError("Please connect your wallet first");
        return;
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: "YOUR_GAME_WALLET_ADDRESS", // Замените на реальный адрес кошелька
            amount: (option.amount * 1e9).toString(), // Конвертация в нанотоны
            payload: btoa(`Donate:${option.amount}:${option.currency}`),
          },
        ],
      };

      console.log("Sending transaction:", transaction);
      await tonConnectUI.sendTransaction(transaction);

      dispatch(updateBalance(balance + option.gold));
      console.log(
        `Added ${option.gold} gold for ${option.amount} ${option.currency}`
      );
      alert(
        `Successfully donated ${option.amount} ${option.currency}! Added ${option.gold} gold.`
      );
    } catch (error) {
      console.error("Transaction error:", error);
      setError(`Error while sending donation: ${(error as Error).message}`);
    }
  };

  return (
    <div className="bankModal" ref={ref}>
      <h2>Top up gold</h2>
      <p className="walletBalance">Current balance: {formatBalance(balance)}</p>
      <div className="bankModalField">
        <TonConnectButton />
      </div>
      {error && (
        <p className="error" style={{ color: "red" }}>
          {error}
        </p>
      )}
      <div
        className="donationTiles"
        style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
      >
        {donationOptions.map((option, index) => (
          <div
            key={index}
            className="donationTile"
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <p>
              {option.gold} Gold for {option.amount} {option.currency}
            </p>
            <button
              className="donateBtn"
              onClick={() => handleDonate(option)}
              disabled={!tonConnectUI.connected}
            >
              Donate
            </button>
          </div>
        ))}
      </div>
      <button className="closeBtn" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default BankModal;
