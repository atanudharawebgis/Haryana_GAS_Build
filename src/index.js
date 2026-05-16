// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// // import App from './App';
// import reportWebVitals from './reportWebVitals';
// import App from './LandPage'
// // import App from './OpenLayer'
// // import App from './test'

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();

// ===========================================================================================

// import React, { useState } from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// // import reportWebVitals from './reportWebVitals';

// // Import your pages
// import LandPage from "./LandPage"; // Your landing page file name
// import OpenLayerMap from "./OpenLayer";
// import Dashboard from "./Dashboard";

// const root = ReactDOM.createRoot(document.getElementById("root"));

// // Main Router Component
// const AppRouter = () => {
//   const [currentPage, setCurrentPage] = useState("landing");

//   return (
//     <React.StrictMode>
//       {/* Landing Page */}
//       {currentPage === "landing" && (
//         <LandPage
//           onNavigateToMap={() => setCurrentPage("map")}
//           onNavigateToDashboard={() => setCurrentPage("dashboard")}
//         />
//       )}

//       {/* Map Page */}
//       {currentPage === "map" && (
//         <OpenLayerMap onBackToHome={() => setCurrentPage("landing")} />
//       )}

//       {/* Dashboard Page - ADD THIS BLOCK */}
//       {currentPage === "dashboard" && (
//         <Dashboard onBackToHome={() => setCurrentPage("landing")} />
//       )}

//     </React.StrictMode>
//   );
// };

// root.render(<AppRouter />);
// // reportWebVitals();

// ============================================================================================

// for Dashnoard
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
// ============================================================================================

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
// import reportWebVitals from './reportWebVitals';

// Import your pages
import LandPage from "./LandPage";
import MapApp from "./OpenLayer";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Main Router Component - OPTIMIZED
const AppRouter = () => {
  const [currentPage, setCurrentPage] = useState("landing");

  return (
    <React.StrictMode>
      {/* Keep all components mounted but hide with display */}
      <div style={{ display: currentPage === "landing" ? "block" : "none" }}>
        <LandPage
          onNavigateToMap={() => setCurrentPage("map")}
          onNavigateToDashboard={() => setCurrentPage("dashboard")}
          onNavigateToUsers={() => setCurrentPage("users")}
        />
      </div>

      <div style={{ display: currentPage === "map" ? "block" : "none" }}>
        <MapApp
          onBackToHome={() => setCurrentPage("landing")}
          onNavigateToDashboard={() => setCurrentPage("dashboard")}
        />
      </div>

      {currentPage === "dashboard" && (
        <Dashboard
          role="admin"
          isActive={currentPage === "dashboard"}
          onBackToHome={() => setCurrentPage("landing")}
          onBackToMap={() => setCurrentPage("map")}
        />
      )}

      <div style={{ display: currentPage === "users" ? "block" : "none" }}>
        <UserManagement onBackToHome={() => setCurrentPage("landing")} />
      </div>
    </React.StrictMode>
  );
};

root.render(<AppRouter />);
// reportWebVitals();
