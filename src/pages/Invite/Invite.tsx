import React, { useEffect, useState } from "react";
import { UserData, Referal } from "../../Interfaces"; // Исправляем Referral на Referal
import { doc, getDoc } from "firebase/firestore";
import "./InvitePage.css";
import { db } from "../../../firebaseConfig";

interface InviteProps {
  user: UserData;
}

interface ReferralWithDetails {
  id: string; // Явно указываем id как обязательное поле
  firstName?: string;
  username?: string;
}

const Invite: React.FC<InviteProps> = ({ user }) => {
  const [referralLink, setReferralLink] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [referralsWithDetails, setReferralsWithDetails] = useState<
    ReferralWithDetails[]
  >([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  const generateReferralLink = (userId: string): string => {
    const botUsername = "pltc_bot"; // Замените на имя вашего бота
    return `https://t.me/${botUsername}?start=ref_${userId}`;
  };

  // Метод для получения данных рефералов из Firestore
  const fetchReferralData = async (referrals: Referal[]) => {
    setIsLoadingReferrals(true);
    const referralsData: ReferralWithDetails[] = [];
    for (const referral of referrals) {
      try {
        const userRef = doc(db, "userData", referral.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserData;
          referralsData.push({
            id: referral.id,
            firstName: userData.firstName,
            username: userData.username,
          });
        } else {
          // Если пользователь не найден, добавляем только ID
          referralsData.push({ id: referral.id });
        }
      } catch (error) {
        console.error(
          `Ошибка при получении данных реферала ${referral.id}:`,
          error
        );
        referralsData.push({ id: referral.id }); // В случае ошибки добавляем только ID
      }
    }
    setReferralsWithDetails(referralsData);
    setIsLoadingReferrals(false);
  };

  useEffect(() => {
    if (user.id) {
      const link = generateReferralLink(user.id);
      setReferralLink(link);
    } else {
      setReferralLink("Ошибка: пользователь не авторизован");
    }

    // Загружаем данные рефералов при изменении user.referals
    if (user.referals && user.referals.length > 0) {
      fetchReferralData(user.referals);
    } else {
      setReferralsWithDetails([]);
    }
  }, [user]);

  const handleSend = () => {
    const shareText = "Присоединяйся к моей игре-кликеру!";
    //@ts-ignore
    window.Telegram?.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(
        referralLink
      )}&text=${encodeURIComponent(shareText)}`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        {isLoadingReferrals ? (
          <p>Loading friends...</p>
        ) : referralsWithDetails.length > 0 ? (
          <ul>
            {referralsWithDetails.map((friend) => (
              <li key={friend.id}>
                {friend.username || friend.firstName || friend.id}
              </li>
            ))}
          </ul>
        ) : (
          <p>No friends invited yet.</p>
        )}
      </div>
    </div>
  );
};

export default Invite;
