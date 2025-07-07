// pages/Invite/Invite.tsx
import "./Invite.css";
import React from "react";
import { useInviteLogic } from "./useInviteLogic";
import FriendTile from "./FriendTile";

const Invite = () => {
  const {
    inviteLink,
    invitedFriends,
    copyToClipboard,
    sendToTelegram,
    markRewardClaimed,
  } = useInviteLogic();

  return (
    <div className="invitePage">
      <div className="inviteSection">
        <h1>Invite Friends</h1>
        <p>Share your referral link and earn rewards!</p>
        <div className="referralLinkSection">
          <input type="text" value={inviteLink} readOnly />
          <button onClick={copyToClipboard}>Copy Link</button>
          <button onClick={sendToTelegram}>Share via Telegram</button>
        </div>
        <h2>Your Referrals</h2>
        {invitedFriends.length === 0 ? (
          <p>No referrals yet. Invite friends to earn rewards!</p>
        ) : (
          <ul className="referralsList">
            {invitedFriends.map((friend) => (
              <li key={friend.id}>
                <FriendTile friend={friend} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Invite;
