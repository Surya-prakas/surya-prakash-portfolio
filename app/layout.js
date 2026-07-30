import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import CompanionLayer from "../components/CompanionLayer";
import { RobotHandoffProvider } from "../components/RobotHandoffContext";

export const metadata = {
  title: "Surya Prakash — AI & Full-Stack Developer",
  description:
    "M.Tech Software Engineering student at JNTUH. Building AI-powered web applications and deep learning systems.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <RobotHandoffProvider>
          {children}
          <CompanionLayer />
        </RobotHandoffProvider>
      </body>
    </html>
  );
}
