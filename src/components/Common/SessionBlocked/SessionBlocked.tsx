import React from "react";
import "./SessionBlocked.css"; // Создадим стили отдельно

const SessionBlocked: React.FC = () => {
  return (
    <div className="session-blocked">
      <h2>Session blocked</h2>
      <p>Please close other tabs with the application.</p>
    </div>
  );
};

export default SessionBlocked;
