import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "../components/layout/Header";
import { BILLIARD_CLOTH_CLASS } from "../services/theme-cloth-background";

export const metadata: Metadata = {
  title: "Калькулятор бильярда Колхоз",
  description: "Создайте стол и добавьте игроков для новой игры",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body className={BILLIARD_CLOTH_CLASS}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
