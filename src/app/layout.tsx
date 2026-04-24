import { DsfrProvider, StartDsfrOnHydration } from "@/dsfr-bootstrap";
import { DsfrHead, getHtmlAttributes } from "@/dsfr-bootstrap/server-only-index";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = undefined; // Can be "fr" or "en" ...
  return (
    <html {...getHtmlAttributes({ lang })} >
      <head>
        <DsfrHead />
      </head>
      <body className="app-shell">
        <DsfrProvider lang={lang}>
          {children}
        </DsfrProvider>
        <StartDsfrOnHydration />
      </body>
    </html>
  );
}
