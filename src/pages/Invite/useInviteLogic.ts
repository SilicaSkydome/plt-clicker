// pages/Invite/useInviteLogic.ts
import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { db } from "../../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

export function useInviteLogic() {
  const user = useAppSelector((state) => state.user.user);
  const [invitedFriends, setInvitedFriends] = useState<any[]>([]);
  const inviteLink = user?.id
    ? `https://t.me/pltc_bot?start=ref_${user.id}`
    : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    localStorage.setItem("inviteCopied", "true");
  };

  const sendToTelegram = () => {
    const message = `Join me in this awesome game! Click here: ${inviteLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(message)}`);
  };

  const loadInvitedFriends = async () => {
    if (!user?.id) return;
    const q = query(
      collection(db, "userData"),
      where("invitedBy", "==", user.id)
    );
    const snapshot = await getDocs(q);
    const friends = snapshot.docs.map((doc) => doc.data());
    setInvitedFriends(friends);
  };

  const markRewardClaimed = async (friendId: string) => {
    try {
      const ref = doc(db, "userData", friendId);
      await updateDoc(ref, { rewardClaimed: true });
      await loadInvitedFriends();
    } catch (err) {
      console.error("Failed to mark reward claimed:", err);
    }
  };

  useEffect(() => {
    loadInvitedFriends();
  }, [user?.id]);

  return {
    inviteLink,
    invitedFriends,
    copyToClipboard,
    sendToTelegram,
    markRewardClaimed,
  };
}
