// pages/Invite/FriendTile.tsx
import React from "react";

interface FriendTileProps {
  friend: {
    id: string;
    username?: string;
    firstName?: string;
    photoUrl?: string;
    rank?: {
      title: string;
    };
  };
}

const FriendTile: React.FC<FriendTileProps> = ({ friend }) => {
  const name = friend.username || friend.firstName || "Unknown";
  const avatar = friend.photoUrl || "https://placehold.co/40";
  const rankTitle = friend.rank?.title || "No rank";

  return (
    <div className="friendTile">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{rankTitle}</p>
    </div>
  );
};

export default FriendTile;
