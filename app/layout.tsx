export const metadata = {
  title: 'Premier League Prediction Game 2025-26',
  description: 'Drag-and-drop predictions, live standings, and leaderboards',
};

import './globals.css';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
