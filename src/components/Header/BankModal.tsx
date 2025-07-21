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
        setError("Подключите кошелёк");
        return;
      }

      let address = "UQBPyg8CUlZj-awtwD0gvYPU1M2g8CxkJ6QcSAzNbxEzJ1H5"; // Твой кошелёк для TON
      let amount = (option.amount * 1e9).toString(); // TON: 9 decimals
      let payload: string | undefined = undefined;

      if (option.currency === "USDT") {
        address = "EQCxE6mUtQJKFnGfaROTKOt1lzbY6CpTq3ppB4-CgH9B_wkZ"; // USDT смарт-контракт
        amount = "10000000"; // Минимальный TON для комиссии (0.01 TON), вместо USDT-суммы
        payload = undefined; // Временно убираем payload
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

      console.log("Отправка транзакции:", transaction);
      await tonConnectUI.sendTransaction(transaction);

      dispatch(updateBalance(balance + option.gold));
      console.log(
        `Добавлено ${option.gold} золота за ${option.amount} ${option.currency}`
      );
      alert(
        `Успешно отправлено ${option.amount} ${option.currency}! Добавлено ${option.gold} золота.`
      );
      setError(null);
    } catch (error) {
      console.error("Ошибка транзакции:", error);
      setError(`Ошибка при отправке: ${(error as Error).message}`);
    }
  };

  return (
    <div className="bankModal" ref={ref}>
      <h2>Пополнить золото</h2>
      <p className="walletBalance">Текущий баланс: {formatBalance(balance)}</p>
      <div className="bankModalField">
        <TonConnectButton />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="donationTiles">
        {donationOptions.map((option, index) => (
          <div key={index} className="donationTile">
            <p>
              {option.gold} золота за {option.amount} {option.currency}
            </p>
            <button
              className="donateBtn"
              onClick={() => handleDonate(option)}
              disabled={!tonConnectUI.connected}
            >
              Пополнить
            </button>
          </div>
        ))}
      </div>
      <button className="closeBtn" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
};

export default BankModal;
