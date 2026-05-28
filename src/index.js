// // ============================================================================================

// // for Dashnoard
// import "react-grid-layout/css/styles.css";
// import "react-resizable/css/styles.css";
// // ============================================================================================

// import React, { useState } from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// // import reportWebVitals from './reportWebVitals';

// // Import your pages
// import LandPage from "./LandPage";
// import MapApp from "./OpenLayer";
// import Dashboard from "./Dashboard";
// import UserManagement from "./UserManagement";

// const root = ReactDOM.createRoot(document.getElementById("root"));

// // Main Router Component - OPTIMIZED
// const AppRouter = () => {
//   const [currentPage, setCurrentPage] = useState("landing");

//   return (
//     <React.StrictMode>
//       {/* Keep all components mounted but hide with display */}

//       <div
//         style={{
//           display: currentPage === "landing" ? "block" : "none",
//           height: currentPage === "landing" ? "100vh" : "0",
//           overflow: "hidden",
//         }}
//       >
//         <LandPage
//           onNavigateToMap={() => setCurrentPage("map")}
//           onNavigateToDashboard={() => setCurrentPage("dashboard")}
//           onNavigateToUsers={() => setCurrentPage("users")}
//         />
//       </div>

//       <div
//         style={{
//           display: currentPage === "map" ? "block" : "none",
//           height: currentPage === "map" ? "100vh" : "0",
//           overflow: "hidden",
//         }}
//       >
//         <MapApp
//           onBackToHome={() => setCurrentPage("landing")}
//           onNavigateToDashboard={() => setCurrentPage("dashboard")}
//         />
//       </div>

//       {currentPage === "dashboard" && (
//         <Dashboard
//           role="admin"
//           isActive={currentPage === "dashboard"}
//           onBackToHome={() => setCurrentPage("landing")}
//           onBackToMap={() => setCurrentPage("map")}
//         />
//       )}

//       <div
//         style={{
//           display: currentPage === "users" ? "block" : "none",
//           height: currentPage === "users" ? "100vh" : "0",
//           overflow: "hidden",
//         }}
//       >
//         <UserManagement onBackToHome={() => setCurrentPage("landing")} />
//       </div>
//     </React.StrictMode>
//   );
// };

// root.render(<AppRouter />);
// // reportWebVitals();
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import LandPage from "./LandPage";
import MapApp from "./OpenLayer";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";

// ── Page wrappers — navigate inject karte hain ──────────────

function LandingPage() {
  const navigate = useNavigate();
  return (
    <LandPage
      onNavigateToMap={() => navigate("/mapview")}
      onNavigateToDashboard={() => navigate("/dashboard")}
      onNavigateToUsers={() => navigate("/users")}
    />
  );
}

function MapPage() {
  const navigate = useNavigate();
  return (
    <MapApp
      onBackToHome={() => navigate("/")}
      onNavigateToDashboard={() => navigate("/dashboard")}
    />
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  return (
    <Dashboard
      role="admin"
      onBackToHome={() => navigate("/")}
      onNavigateToMap={() => navigate("/mapview")}
    />
  );
}

function UsersPage() {
  const navigate = useNavigate();
  return <UserManagement onBackToHome={() => navigate("/")} />;
}

// ── Root ────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mapview" element={<MapPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
