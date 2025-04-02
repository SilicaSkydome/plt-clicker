import React, { useEffect, useState } from "react";

// Extend the Window interface to include Telegram
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        initDataUnsafe: { user?: { id: number } };
        openTelegramLink: (url: string) => void;
      };
    };
  }
}
import "./InvitePage.css";

const Invite: React.FC = () => {
  const [referralLink, setReferralLink] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Генерация реферальной ссылки
  const generateReferralLink = (userId: number): string => {
    const botUsername = "pltc_bot"; // Замените на имя вашего бота
    return `https://t.me/${botUsername}?start=ref_${userId}`;
  };

  // Инициализация ссылки при загрузке
  useEffect(() => {
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    const userId = webApp.initDataUnsafe.user?.id;

    if (userId) {
      const link = generateReferralLink(userId);
      setReferralLink(link);
    } else {
      setReferralLink("Ошибка: пользователь не авторизован");
    }
  }, []);

  // Функция отправки ссылки через Telegram
  const handleSend = () => {
    const shareText = "Присоединяйся к моей игре-кликеру!";
    window.Telegram.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(
        referralLink
      )}&text=${encodeURIComponent(shareText)}`
    );
  };

  // Функция копирования ссылки в буфер обмена
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Сбрасываем через 2 секунды
    });
  };

  return (
    <div className="invPage">
      <div className="inviteSection">
        <h1>Invite Friends</h1>
        <h2>Your Referral Link</h2>
        <p>Copy or send your link directly to friends</p>
        <input
          type="text"
          value={referralLink}
          readOnly
          className="referralInput"
        />
        <div className="buttonGroup">
          <button onClick={handleSend} className="sendButton">
            Send via Telegram
          </button>
          <button onClick={handleCopy} className="copyButton">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="friendsSection">
        <h4>Friends</h4>
        {/* Здесь можно добавить список приглашенных друзей */}
        <p>No friends invited yet.</p>
      </div>
    </div>
  );
};

export default Invite;
