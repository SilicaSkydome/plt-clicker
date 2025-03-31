import React from "react";
import "./ProgressBar.css";

function ProgressBar() {
  return (
    <div className="progressBar">
      <input type="range" name="progressBar" id="progressBar" />
    </div>
  );
}

export default ProgressBar;
