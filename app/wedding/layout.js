// Nested layout: goes in the same folder as page.js (e.g. app/wedding/layout.js).
// It does NOT replace your root layout, so no <html>/<body> here.
export const metadata = {
  title: "Ife & Niyi · 27 March 2027",
  description: "Join us in Tirana, Albania to celebrate our wedding.",
  robots: { index: false, follow: false },
};

export default function WeddingLayout({ children }) {
  return children;
}