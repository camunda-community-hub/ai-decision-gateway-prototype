import "./carbon.scss";

export const metadata = {
  title: "AI Decision Gateway",
  description: "Discovery Dashboard for the AI Decision Gateway",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
