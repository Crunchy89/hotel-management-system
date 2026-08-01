export const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/calendar": "Calendar",
  "/check-in": "Check-In",
  "/reservations": "Reservations",
  "/rooms": "Manage Room",
  "/housekeeping": "Housekeeping",
  "/rates": "Rooms & Prices",
  "/guests": "Guests",
  "/channels": "Channels",
  "/yield-rules": "Yield Rules",
  "/insights": "Insights",
  "/messages": "Guest messages",
  "/book": "Direct booking",
};

export function routeLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]!;
  for (const [path, label] of Object.entries(ROUTE_LABELS)) {
    if (path !== "/" && pathname.startsWith(path)) return label;
  }
  return "HMS Hotel";
}

export function routeSection(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/insights")) return "Insights";
  if (pathname.startsWith("/check-in")) return "Report";
  if (pathname.startsWith("/book")) return "Direct";
  if (
    [
      "/calendar",
      "/reservations",
      "/housekeeping",
      "/guests",
      "/rooms",
      "/rates",
      "/messages",
    ].some((p) => pathname.startsWith(p))
  ) {
    return "Operational";
  }
  if (
    ["/channels", "/yield-rules"].some((p) => pathname.startsWith(p))
  ) {
    return "Strategic";
  }
  return "Operational";
}
