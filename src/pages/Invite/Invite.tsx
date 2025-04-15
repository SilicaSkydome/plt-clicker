import "./Invite.css";
import React, { useState, useEffect } from "react";
import { UserData, Referal } from "../../Interfaces";

interface InviteProps {
  user: UserData;
}

function Invite({ user }: InviteProps) {
  const [referrals, setReferrals] = useState<Referal[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

  // Получаем реферальную ссылку
  const referralLink = user.id
    ? `https://t.me/YourBotName?start=ref_${user.id}`
    : "";

  // Функция для копирования ссылки
  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      alert("Referral link copied to clipboard!");
    }
  };

  // Функция для отправки ссылки через Telegram
  const shareViaTelegram = () => {
    if (referralLink) {
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
        referralLink
      )}&text=Join me in this awesome game!`;
      window.open(telegramShareUrl, "_blank");
    }
  };

  useEffect(() => {
    // Проверяем, есть ли рефералы в localStorage
    const cachedReferrals = localStorage.getItem(`referrals_${user.id}`);
    if (cachedReferrals) {
      setReferrals(JSON.parse(cachedReferrals));
      setIsLoadingReferrals(false); // Устанавливаем isLoadingReferrals в false, если есть локальные данные
    }

    // Синхронизируем рефералов из user.referals (Firestore)
    if (user.referals) {
      setReferrals(user.referals);
      setIsLoadingReferrals(false);
      // Сохраняем рефералов в localStorage
      localStorage.setItem(
        `referrals_${user.id}`,
        JSON.stringify(user.referals)
      );
    }
  }, [user.referals, user.id]);

  return (
    <div className="invitePage">
      <div className="inviteSection">
        <h1>Invite Friends</h1>
        <p>Share your referral link and earn rewards!</p>
        <div className="referralLinkSection">
          <input type="text" value={referralLink} readOnly />
          <button onClick={copyToClipboard}>Copy Link</button>
          <button onClick={shareViaTelegram}>Share via Telegram</button>
        </div>
        <h2>Your Referrals</h2>
        {isLoadingReferrals && referrals.length === 0 ? (
          <p>Loading...</p>
        ) : referrals.length === 0 ? (
          <p>No referrals yet. Invite friends to earn rewards!</p>
        ) : (
          <ul className="referralsList">
            {referrals.map((referral, index) => (
              <li key={index}>Friend ID: {referral.id}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Invite;
