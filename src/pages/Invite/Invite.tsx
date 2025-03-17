import React from "react";
import "./Invite.css";

function Invite() {
  return (
    <div className="invPage">
      <div className="inviteSection">
        <h1>Invite Friends</h1>
        <h2>Your referal link</h2>
        <p>Copy or send your link directly to friends</p>
        <input type="text" />
        <button>Send</button>
        <div>Copy</div>
      </div>
      <div className="friendsSection">
        <h4>Friends</h4>
      </div>
    </div>
  );
}

export default Invite;
