import "./Invite.css";
import React, { useState, useEffect } from "react";
import { UserData, Referal } from "../../Interfaces";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

interface InviteProps {
  user: UserData;
}

interface FriendData {
  id: string;
  name: string; // Will store username or firstName
}

function Invite({ user }: InviteProps) {
  const [referrals, setReferrals] = useState<Referal[]>([]);
  const [friendsData, setFriendsData] = useState<FriendData[]>([]); // Store friend data
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

  const getFriendFromId = async (
    friendId: string
  ): Promise<Partial<UserData> | null> => {
    try {
      const friendDocRef = doc(db, "userData", friendId);
      const friendDoc = await getDoc(friendDocRef);

      if (friendDoc.exists()) {
        const friendData = friendDoc.data() as UserData;
        return {
          id: friendData.id,
          firstName: friendData.firstName,
          username: friendData.username,
          photoUrl: friendData.photoUrl,
          balance: friendData.balance,
          rank: friendData.rank,
        };
      } else {
        console.log(`Пользователь с ID ${friendId} не найден в Firestore`);
        return null;
      }
    } catch (error) {
      console.error("Ошибка при получении данных друга из Firestore:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchReferralsAndFriends = () => {
      // Проверяем, есть ли рефералы в localStorage
      const cachedReferrals = localStorage.getItem(`referrals_${user.id}`);
      let referralsToUse = [];
      if (cachedReferrals) {
        referralsToUse = JSON.parse(cachedReferrals);
        setReferrals(referralsToUse);
      }

      // Синхронизируем рефералов из user.referals (Firestore)
      if (user.referals) {
        referralsToUse = user.referals;
        setReferrals(user.referals);
        // Сохраняем рефералов в localStorage
        localStorage.setItem(
          `referrals_${user.id}`,
          JSON.stringify(user.referals)
        );
      }

      // Fetch friend data for all referrals
      if (referralsToUse.length > 0) {
        Promise.all(
          referralsToUse.map((referral: Referal) =>
            getFriendFromId(referral.id).then((friend) => ({
              id: referral.id,
              name: friend?.username || friend?.firstName || "Unknown",
            }))
          )
        )
          .then((friends) => {
            setFriendsData(friends);
            setIsLoadingReferrals(false);
          })
          .catch((error) => {
            console.error("Error fetching friends:", error);
            setIsLoadingReferrals(false);
          });
      } else {
        setIsLoadingReferrals(false);
      }
    };

    fetchReferralsAndFriends();
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
            {referrals.map((referral, index) => {
              const friend = friendsData.find((f) => f.id === referral.id);
              return (
                <li key={index}>
                  Player: {friend ? friend.name : "Loading..."}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Invite;
