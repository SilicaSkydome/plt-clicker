// src/AppContent.tsx
import React, { useEffect, useState } from "react";
import { useLocation, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch, useAppSelector } from "./store";
import { ranks } from "./Data";
import Game from "./pages/Game/Game";
import Stats from "./pages/Stats/Stats";
import Invite from "./pages/Invite/Invite";
import Earn from "./pages/Earn/Earn";
import Store from "./pages/Shop/Shop";
import RoadMap from "./pages/Map/Map";
import NavMenu from "./components/NavMenu/NavMenu";
import Shop from "./pages/Shop/Shop";
import { updateBalance } from "./store/gameSlice";
import { Toaster } from "react-hot-toast";

const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

const AppContent = () => {
  const location = useLocation();
  const [isNight, setIsNight] = useState(isNightTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNight(isNightTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const bgClass = () => {
    switch (location.pathname) {
      case "/":
        return isNight ? "game-bg-night" : "game-bg";
      default:
        return isNight ? "default-bg-night" : "default-bg";
    }
  };

  const balance = useSelector((state: RootState) => state.game.balance);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const rank = useSelector((state: RootState) => state.game.rank);
  const energy = useSelector((state: RootState) => state.game.energy);
  const lastEnergyUpdate = useSelector(
    (state: RootState) => state.game.lastEnergyUpdate
  );

  const user = useAppSelector((state) => state.user.user);
  const isLoading = useAppSelector((state) => state.user.isLoading);
  const locationState = user?.location || "1stSea";

  if (isLoading || !user) {
    return <div>Loading user...</div>;
  }

  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   if (user) {
  //     console.log("Syncing gameSlice balance with user.balance:", user.balance);
  //     dispatch(updateBalance(user.balance));
  //   }
  // }, [user, dispatch]);

  return (
    <div className={`app ${bgClass()}`}>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/earn" element={<Earn />} />
        {/* <Route
          path="/shop"
          element={<Shop user={user!} telegramUserId={user!.id} />}
        /> */}
        <Route path="/map" element={<RoadMap />} />
      </Routes>
      <NavMenu />
      <Toaster />
    </div>
  );
};

export default AppContent;
