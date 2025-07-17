import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store";
import { formatBalance } from "./utils";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { updateBalance } from "../../store/gameSlice"; // Предполагаемый action
import "./Header.css";

interface Props {
  onClose: () => void;
  ref?: any;
}

const BankModal: React.FC<Props> = ({ onClose, ref }) => {
  const dispatch = useAppDispatch();
  const balance = useAppSelector((state) => state.game.balance);
  const [tonConnectUI] = useTonConnectUI();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");

  const currencies = ["USDT", "TON", "JETTON"];

  const handleDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Введите корректную сумму");
      return;
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: "YOUR_GAME_WALLET_ADDRESS", // Укажи адрес кошелька игры
            amount: (Number(amount) * 1e9).toString(), // Конвертация в нанотоны
            payload: btoa(`Donate:${amount}:${currency}`),
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);

      // Предполагаемый курс: 1 USDT/TON = 100 золота (уточни, если иначе)
      const goldAmount = Number(amount) * 100;
      dispatch(updateBalance(balance + goldAmount));

      alert("Донат успешно отправлен!");
      setAmount("");
    } catch (error) {
      console.error("Ошибка транзакции:", error);
      alert("Ошибка при отправке доната");
    }
  };

  return (
    <div className="bankModal" ref={ref}>
      <h2>Пополнить золото</h2>
      <p className="walletBalance">Текущий баланс: {formatBalance(balance)}</p>
      <div className="bankModalField">
        <label>Валюта</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bankModalSelect"
        >
          {currencies.map((curr) => (
            <option key={curr} value={curr}>
              {curr}
            </option>
          ))}
        </select>
      </div>
      <div className="bankModalField">
        <label>Сумма</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Введите сумму"
          className="bankModalInput"
        />
      </div>
      <div className="bankModalField">
        <TonConnectButton />
      </div>
      <button className="bankModalBtn" onClick={handleDonate}>
        Пополнить
      </button>
      <button className="closeBtn" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
};

export default BankModal;
