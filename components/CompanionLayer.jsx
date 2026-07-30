"use client";

import { useState } from "react";
import RobotCompanion from "./RobotCompanion";
import ChatWidget from "./ChatWidget";
import { useRobotHandoff } from "./RobotHandoffContext";

// Single client component that owns the shared "isThinking" state so the
// robot's pose and the chat widget's loading state stay in sync. Reads
// show2DRobot from RobotHandoffContext, set to true once HeroRobot3D's
// entrance finishes (see HeroRobot3D.jsx and RobotHandoffContext.jsx).
export default function CompanionLayer() {
  const [isThinking, setIsThinking] = useState(false);
  const { show2DRobot } = useRobotHandoff();

  if (!show2DRobot) return <ChatWidget onThinking={setIsThinking} />;

  return (
    <>
      <RobotCompanion isThinking={isThinking} />
      <ChatWidget onThinking={setIsThinking} />
    </>
  );
}
