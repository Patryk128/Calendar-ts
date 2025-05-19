import React from "react";
import ReactDOM from "react-dom/client";
import App from "./Components/Shared/App.js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Components/ReactCalendar/styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
