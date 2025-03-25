import React, { useState, useEffect } from "react";
import { LoginButton } from "@telegram-auth/react";

import Game from "./Game";

const Login = ({ setBalance }: { setBalance: (value: number) => void }) => {
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const app = (window as any).Telegram?.WebApp;
    if (app) {
      app.ready();
      const user = app.initDataUnsafe?.user;
      if (user) {
        const userData = {
          id: user.id.toString(),
          firstName: user.first_name,
          username: user.username || "",
          lastInteraction: new Date().toISOString(),
        };
        setTelegramId(user.id.toString());
        console.log("Пользователь из Mini App:", userData);

        // Отправляем данные пользователя на сервер
        fetch("/saveUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        })
          .then((response) => response.json())
          .then((result) => {
            console.log("Данные сохранены:", result);
          })
          .catch((err) => {
            console.error("Ошибка при сохранении:", err);
            setError("Не удалось сохранить данные");
          });
      } else {
        console.log("Пользователь не найден в Mini App");
        setError("Не удалось получить данные пользователя");
      }
    } else {
      console.log("Telegram WebApp не доступен");
      setError("Запустите приложение через Telegram");
    }
  }, []);

  const handleAuth = async (data: any) => {
    console.log("Данные от Telegram:", data);
    if (data.error) {
      setError(data.error);
      console.error("Ошибка входа:", data.error);
      return;
    }
    setTelegramId(data.id.toString());
    try {
      const response = await fetch("/saveUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log("Данные сохранены:", result);
    } catch (err) {
      console.error("Ошибка при сохранении:", err);
      setError("Не удалось сохранить данные");
    }
  };

  if (!telegramId) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Войдите, чтобы начать игру</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <LoginButton botUsername="@pltc_bot" onAuthCallback={handleAuth} />
      </div>
    );
  }

  return <Game setBalance={setBalance} telegramId={telegramId} />;
};

export default Login;
