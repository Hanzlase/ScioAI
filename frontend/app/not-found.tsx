// Custom 404 Not Found page – ScioAI
import type { Metadata } from "next";
import NotFoundClient from "./NotFoundClient";

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "The page you are looking for does not exist. Return to ScioAI and start an autonomous research session.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundClient />;
}
