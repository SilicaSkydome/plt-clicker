// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./store";
import { fetchUserData } from "./store/userSlice";
import { setRank } from "./store/gameSlice";
import { ranks } from "./Data";
import useSession from "./api/UseSession";
import SessionBlocked from "./components/Common/SessionBlocked/SessionBlocked";
import AppContent from "./AppContent";
import { useAppDispatch, useAppSelector } from "./store";
import "./App.css";
import { use } from "matter";

const App = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.user?.id || "");
  const isLoading = useSelector((state: RootState) => state.user.isLoading);
  const { isSessionBlocked } = useSession(userId);

  useEffect(() => {
    let telegramUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;

    dispatch(fetchUserData(telegramUser));
  }, [dispatch]);

  const balance = useAppSelector((state) => state.game.balance);

  useEffect(() => {
    const rankCalc = (gold: number) => {
      for (const rank of ranks) {
        if (rank.goldMax === null && gold >= rank.goldMin) return rank;
        if (
          rank.goldMax !== null &&
          gold >= rank.goldMin &&
          gold <= rank.goldMax
        )
          return rank;
      }
      return ranks[0];
    };

    dispatch(setRank(rankCalc(balance)));
  }, [balance, dispatch]);

  return isSessionBlocked ? (
    <SessionBlocked />
  ) : (
    <Router>{!isLoading && <AppContent />}</Router>
  );
};

export default App;
