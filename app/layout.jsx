import "./globals.css";

export const metadata = {
  title: "Old Soul Mercantile — Objects With a Past",
  description: "Curated antiques, restored with care and sourced with provenance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("%c  F  A  K  H  R  U  L  ","font:700 18px monospace;color:#e5b94f;background:#25131d;padding:10px 16px;letter-spacing:4px")`,
          }}
        />
      </body>
    </html>
  );
}
