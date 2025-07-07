// components/Header/useHeaderLogic.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useHeaderLogic() {
  const [showProfile, setShowProfile] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const navigate = useNavigate();

  const toggleProfile = () => setShowProfile((prev) => !prev);
  const toggleBank = () => setShowBank((prev) => !prev);

  const goToMap = () => navigate("/map");

  return {
    showProfile,
    showBank,
    toggleProfile,
    toggleBank,
    goToMap,
  };
}
