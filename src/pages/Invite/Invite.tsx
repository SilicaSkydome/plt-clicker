import "./Invite.css";
import React, { useState, useEffect } from "react";
import {
  UserData,
  Referal,
  Rank,
  FriendData,
  InviteProps,
} from "../../Interfaces";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

function Invite({ user }: InviteProps) {
  const [referrals, setReferrals] = useState<Referal[]>([]);
  const [friendsData, setFriendsData] = useState<FriendData[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

  // Получаем реферальную ссылку
  const referralLink = user.id
    ? `https://t.me/pltc_bot?start=ref_${user.id}`
    : "";

  // Функция для копирования ссылки с запасным вариантом
  const copyToClipboard = async () => {
    if (referralLink) {
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(referralLink);
          alert("Referral link copied to clipboard!");
        } catch (error) {
          console.error("Failed to copy to clipboard:", error);
          fallbackCopyToClipboard(referralLink);
        }
      } else {
        fallbackCopyToClipboard(referralLink);
      }
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      alert("Referral link copied to clipboard!");
    } catch (error) {
      console.error("Fallback copy failed:", error);
      alert("Failed to copy link. Please copy it manually.");
    }
    document.body.removeChild(textArea);
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

  // Получение данных друга из Firestore
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

  // Загрузка рефералов из localStorage
  const loadCachedReferrals = () => {
    const cachedReferrals = localStorage.getItem(`referrals_${user.id}`);
    if (cachedReferrals) {
      setReferrals(JSON.parse(cachedReferrals));
    }
  };

  // Синхронизация рефералов из Firestore
  const syncReferralsFromFirestore = () => {
    if (user.referals && user.referals.length > 0) {
      setReferrals(user.referals);
      localStorage.setItem(
        `referrals_${user.id}`,
        JSON.stringify(user.referals)
      );
    }
  };

  // Получение данных друзей
  const fetchFriendsData = async (referrals: Referal[]) => {
    if (referrals.length === 0) {
      setIsLoadingReferrals(false);
      return;
    }
    try {
      const friends = await Promise.all(
        referrals.map((referral) =>
          getFriendFromId(referral.id).then((friend) => ({
            id: referral.id,
            name: friend?.username || friend?.firstName || "Unknown",
            photoUrl: friend?.photoUrl,
            rank: friend?.rank || null,
          }))
        )
      );
      setFriendsData(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Обработка загрузки рефералов и данных друзей
  useEffect(() => {
    const fetchReferralsAndFriends = async () => {
      loadCachedReferrals();
      syncReferralsFromFirestore();
      await fetchFriendsData(user.referals || []);
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
        {isLoadingReferrals ? (
          <p>Loading...</p>
        ) : referrals.length === 0 ? (
          <p>No referrals yet. Invite friends to earn rewards!</p>
        ) : (
          <ul className="referralsList">
            {referrals.map((referral) => {
              const friend = friendsData.find((f) => f.id === referral.id);
              return (
                <li key={referral.id}>
                  {friend ? (
                    <div className="friendTile">
                      <img
                        src={friend.photoUrl || "https://placehold.co/40"}
                        alt={friend.name}
                      />
                      <h3>{friend.name}</h3>
                      <p>
                        {friend.rank ? String(friend.rank.title) : "No rank"}
                      </p>
                    </div>
                  ) : (
                    "Loading..."
                  )}
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
