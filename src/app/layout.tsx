import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { OverlayProvider } from "@/components/overlays";
import { getUserPrefs } from "@/actions/userPrefs";

export const metadata: Metadata = {
  title: "Goodness Gardens \u2014 Task Manager",
  description: "Lightweight task delegation for the Goodness Gardens team",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const prefs = await getUserPrefs();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                var stored = localStorage.getItem('gg-theme-preference');
                var theme = stored || 'system';
                var resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', resolved);
              } catch(e) {}
            })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider initialTheme={prefs.theme}>
          <OverlayProvider>{children}</OverlayProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
