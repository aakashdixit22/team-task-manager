import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "TaskFlow — Team Task Manager",
  description: "A modern team task management application. Create projects, assign tasks, and track progress with role-based access control.",
  keywords: ["task manager", "project management", "team collaboration"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
