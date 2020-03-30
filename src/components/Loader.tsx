import React from "react";

import { ReactComponent as Logo } from "../assets/logo.svg";

import "./Loader.css";

export default function Loader() {
  return (
    <div
      style={{
        height: "100vh",
        background: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Logo
        className="Loading--logo"
        style={{ height: "150px", width: "auto" }}
      />
    </div>
  );
}
