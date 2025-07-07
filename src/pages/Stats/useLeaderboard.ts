// pages/Stats/useLeaderboard.ts
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { playerRank } from "../../Interfaces";

export function useLeaderboard(topN: number = 30) {
  const [players, setPlayers] = useState<playerRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "userData"),
          orderBy("balance", "desc"),
          limit(topN)
        );
        const snapshot = await getDocs(q);
        const playerData: playerRank[] = snapshot.docs.map((doc, index) => ({
          rank: index + 1,
          title: doc.data().rank?.title || "No Rank",
          name: doc.data().username || doc.data().firstName,
          balance: doc.data().balance,
          avatar: doc.data().photoUrl || "https://placehold.co/100",
        }));
        setPlayers(playerData);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [topN]);

  return { players, loading, error };
}
