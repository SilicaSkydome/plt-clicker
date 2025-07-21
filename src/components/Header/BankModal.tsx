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
  ];

  const handleDonate = async (option: DonationOption) => {
    try {
      if (!tonConnectUI.connected) {
        setError("Connect your wallet");
        return;
      }

      let address = "UQBPyg8CUlZj-awtwD0gvYPU1M2g8CxkJ6QcSAzNbxEzJ1H5"; // Your TON wallet
      let amount = (option.amount * 1e9).toString(); // TON: 9 decimals
      let payload: string | undefined = undefined;

      if (option.currency === "USDT") {
        address = "EQCxE6mUtQJKFnGfaROTKOt1lzbY6CpTq3ppB4-CgH9B_wkZ"; // USDT smart contract
        amount = "10000000"; // Minimum TON for fee (0.01 TON), instead of USDT amount
        payload = undefined; // Temporarily remove payload
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address,
            amount,
            payload,
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
        `Successfully sent ${option.amount} ${option.currency}! Added ${option.gold} gold.`
      );
      setError(null);
    } catch (error) {
      console.error("Transaction error:", error);
      setError(`Error while sending: ${(error as Error).message}`);
    }
  };

  return (
    <div className="bankModal" ref={ref}>
      <h2>Top up gold</h2>
      <p className="walletBalance">Current balance: {formatBalance(balance)}</p>
      <div className="bankModalField">
        <TonConnectButton />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="donationTiles">
        {donationOptions.map((option, index) => (
          <div key={index} className="donationTile">
            <p>
              {option.gold} gold for {option.amount} {option.currency}
            </p>
            <button
              className="donateBtn"
              onClick={() => handleDonate(option)}
              disabled={!tonConnectUI.connected}
            >
              Top up
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
