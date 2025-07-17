// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./store";
import { fetchUserData } from "./store/userSlice";
import { setRank, updateBalance } from "./store/gameSlice";
import { ranks } from "./Data";
import useSession from "./api/UseSession";
import SessionBlocked from "./components/Common/SessionBlocked/SessionBlocked";
import AppContent from "./AppContent";
import { useAppDispatch, useAppSelector } from "./store";
import "./App.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

const App = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.user?.id || "");
  const isLoading = useSelector((state: RootState) => state.user.isLoading);
  const { isSessionBlocked } = useSession(userId);

  useEffect(() => {
    let telegramUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;

    dispatch(fetchUserData(telegramUser));
  }, []);

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
  }, [balance]);

  return isSessionBlocked ? (
    <SessionBlocked />
  ) : (
    <Router>
      <TonConnectUIProvider
        manifestUrl="https://pltclicker.netlify.app/tonconnect-manifest.json"
        actionsConfiguration={{ twaReturnUrl: "https://t.me/pltc_bot" }}
      >
        {!isLoading && <AppContent />}
      </TonConnectUIProvider>
    </Router>
  );
};

export default App;
