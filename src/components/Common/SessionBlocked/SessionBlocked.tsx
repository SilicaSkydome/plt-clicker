import React from "react";
import "./SessionBlocked.css"; // Создадим стили отдельно

const SessionBlocked: React.FC = () => {
  return (
    <div className="session-blocked">
      <h2>Сессия заблокирована</h2>
      <p>Пожалуйста, закройте другие вкладки с приложением.</p>
    </div>
  );
};

export default SessionBlocked;
