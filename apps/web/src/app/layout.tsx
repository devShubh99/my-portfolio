import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "StockFolio — Indian Market Portfolio Tracker",
  description:
    "Track your NSE/BSE investments with real-time data, technical analysis, and AI-driven market insights.",
};

// Inline script to suppress browser extension errors before React loads
const extensionGuardScript = `
(function(){
  var p=[
    "message channel closed",
    "extension context invalidated",
    "chrome-extension://",
    "moz-extension://",
    "listener indicated an asynchronous response",
    "resizeobserver loop"
  ];
  function m(s){
    if(!s)return false;
    var l=s.toLowerCase();
    for(var i=0;i<p.length;i++){if(l.indexOf(p[i])!==-1)return true;}
    return false;
  }
  window.addEventListener("error",function(e){
    if(e.message&&m(e.message)){e.preventDefault();e.stopImmediatePropagation();return true;}
  },true);
  window.addEventListener("unhandledrejection",function(e){
    var s=e.reason&&(e.reason.message||e.reason.toString())||"";
    if(m(s)){e.preventDefault();}
  },true);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: extensionGuardScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
