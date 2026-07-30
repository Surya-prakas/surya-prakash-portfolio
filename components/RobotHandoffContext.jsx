"use client";

import { createContext, useContext, useState } from "react";

const RobotHandoffContext = createContext(null);

export function RobotHandoffProvider({ children }) {
  const [show2DRobot, setShow2DRobot] = useState(false);
  return (
    <RobotHandoffContext.Provider value={{ show2DRobot, setShow2DRobot }}>
      {children}
    </RobotHandoffContext.Provider>
  );
}

// Used by HeroRobot3D to signal "my entrance is done, show the 2D guide now"
export function useRobotHandoff() {
  const ctx = useContext(RobotHandoffContext);
  if (!ctx) {
    throw new Error("useRobotHandoff must be used within RobotHandoffProvider");
  }
  return ctx;
}
