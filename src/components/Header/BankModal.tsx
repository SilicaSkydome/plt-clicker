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

const BankModal: React.FC<Props> = ({ onClose, ref }) => {
  const dispatch = useAppDispatch();
  const balance = useAppSelector((state) => state.game.balance);
  const [tonConnectUI] = useTonConnectUI();
  const [amount, setAmount] = useState("1");
  const [currency, setCurrency] = useState("USDT");

  const currencies = ["USDT", "TON", "JETTON"];
  const amounts = ["1", "5", "10", "20", "50", "100"];

  const handleDonate = async () => {
    if (!amount) {
      alert("Выберите сумму");
      return;
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: "YOUR_GAME_WALLET_ADDRESS",
            amount: (Number(amount) * 1e9).toString(),
            payload: btoa(`Donate:${amount}:${currency}`),
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);

      const goldAmount = Number(amount) * 100;
      dispatch(updateBalance(balance + goldAmount));

      alert("Донат успешно отправлен!");
      setAmount("1");
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
        <select
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bankModalSelect"
        >
          {amounts.map((amt) => (
            <option key={amt} value={amt}>
              {amt} {currency}
            </option>
          ))}
        </select>
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
