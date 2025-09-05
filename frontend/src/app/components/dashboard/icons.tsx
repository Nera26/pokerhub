"use client";

/** Minimal inline icon set to match your HTML look (no deps). */
type IconName =
  | "navDash" | "navUsers" | "navTables" | "navTrophy" | "navGift" | "navMegaphone" | "navMail" | "navAnalytics"
  | "group" | "dollar" | "grid" | "trophy" | "arrowUp" | "arrowDown" | "coin" | "userCircle" | "menuSquares";

export function Icon({ name, className="w-5 h-5" }: { name: IconName; className?: string }) {
  switch (name) {
    case "navDash": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z"/></svg>;
    case "navUsers": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm8 2c2.7 0 8 1.3 8 4v2h-8v-2c0-1.8-.8-3.1-2-4 .6-.1 1.3-.1 2-.1zM8 13c-2.7 0-8 1.3-8 4v2h10v-2c0-2.7-5.3-4-8-4z"/></svg>;
    case "navTables": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 3h18v6H3zM3 11h8v10H3zM13 11h8v5h-8zM13 18h8v3h-8z"/></svg>;
    case "navTrophy": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M19 3h-3V2H8v1H5v4c0 2.8 2.2 5 5 5h1v3H8v2h8v-2h-3v-3h1c2.8 0 5-2.2 5-5V3z"/></svg>;
    case "navGift": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M20 12v8a2 2 0 0 1-2 2h-5V12h7zM11 22H6a2 2 0 0 1-2-2v-8h7v10zM22 7H2V5h4.2A3 3 0 1 1 11 3a3 3 0 0 1 4.8 2H22v2zM9 5H7a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm6 0h-2a1 1 0 1 0 0 2h2a1 1 0 0 0 0-2z"/></svg>;
    case "navMegaphone": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M14 4v13l-4-3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5l4-1zM7 18h3l-1 3H7zM16 7h2a3 3 0 1 1 0 6h-2V7z"/></svg>;
    case "navMail": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 13 2 6.8V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.8L12 13zM22 6 12 12 2 6V4l10 6 10-6v2z"/></svg>;
    case "navAnalytics": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 3h2v18H3zM9 11h2v10H9zM15 5h2v16h-2zM21 15h2v6h-2z"/></svg>;
    case "group": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>;
    case "dollar": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M11 2h2v2.1c2.8.5 4 2.2 4 3.9 0 2.8-2.6 3.8-5 4.3-2 .4-3 .9-3 1.7 0 .7.7 1.5 3 1.5 1.4 0 2.6-.4 3.5-.9l1 1.8C15.6 18 14.2 18.4 13 18.6V21h-2v-2.4C7.7 18 6 16.4 6 14.5c0-2.6 2.7-3.6 5-4 2.2-.4 3-1 3-2 0-.7-.7-1.5-3-1.5-1.3 0-2.6.4-3.5 1L6.6 5.2C7.9 4.4 9.4 4.1 11 4V2z"/></svg>;
    case "grid": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/></svg>;
    case "trophy": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M19 3h-3V2H8v1H5v4c0 2.8 2.2 5 5 5h1v3H8v2h8v-2h-3v-3h1c2.8 0 5-2.2 5-5V3z"/></svg>;
    case "arrowUp": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 4l6 6h-4v10h-4V10H6z"/></svg>;
    case "arrowDown": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 20l-6-6h4V4h4v10h4z"/></svg>;
    case "coin": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2C6.5 2 2 4.2 2 7s4.5 5 10 5 10-2.2 10-5-4.5-5-10-5zm0 12c-5.5 0-10 2.2-10 5s4.5 5 10 5 10-2.2 10-5-4.5-5-10-5z"/></svg>;
    case "userCircle": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a3 3 0 110 6 3 3 0 010-6zm0 12a7 7 0 01-5.7-2.9C7.3 14.6 9.5 14 12 14s4.7.6 5.7 2.1A7 7 0 0112 19z"/></svg>;
    case "menuSquares": return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>;
  }
}
