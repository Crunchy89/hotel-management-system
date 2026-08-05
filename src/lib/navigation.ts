export type NavItem = {
  name: string;
  path: string;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

export const TOP_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", path: "/" },
  { name: "Insights", path: "/insights" },
  { name: "Reservations", path: "/reservations" },
  { name: "Manage Room", path: "/rooms" },
  { name: "Rooms & Prices", path: "/rates" },
  { name: "Guests", path: "/guests" },
  { name: "Guest messages", path: "/messages" },
  { name: "Client chat", path: "/chat" },
  { name: "Housekeeping", path: "/housekeeping" },
];

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "report",
    title: "Report",
    items: [
      { name: "Check-In", path: "/check-in" },
      { name: "Booking activity", path: "/booking-activity" },
    ],
  },
  {
    id: "channel-manager",
    title: "Channel manager",
    items: [
      { name: "Channel manager", path: "/channel-manager" },
      { name: "Channels", path: "/channels" },
      { name: "Yield Rules", path: "/yield-rules" },
    ],
  },
];

export const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/reservations": "Reservations",
  "/calendar": "Reservations",
  "/rooms": "Manage Room",
  "/housekeeping": "Housekeeping",
  "/rates": "Rooms & Prices",
  "/guests": "Guests",
  "/channels": "Channels",
  "/channel-manager": "Channel manager",
  "/yield-rules": "Yield Rules",
  "/insights": "Insights",
  "/messages": "Guest messages",
  "/chat": "Client chat",
  "/booking-activity": "Booking activity",
};

export function isActivePath(pathname: string, path: string): boolean {
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

export function sectionForPath(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    if (section.items.some((item) => isActivePath(pathname, item.path))) {
      return section.id;
    }
  }
  return "report";
}

export function sectionItemsForPath(pathname: string): NavItem[] | null {
  const id = sectionForPath(pathname);
  const section = NAV_SECTIONS.find((s) => s.id === id);
  return section && section.items.length > 1 ? section.items : null;
}

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
  if (pathname.startsWith("/reservations") || pathname.startsWith("/calendar")) {
    return "Reservations";
  }
  if (pathname.startsWith("/rooms")) return "Manage Room";
  if (pathname.startsWith("/rates")) return "Rooms & Prices";
  if (pathname.startsWith("/guests")) return "Guests";
  if (pathname.startsWith("/messages")) return "Guest messages";
  if (pathname.startsWith("/chat")) return "Client chat";
  if (pathname.startsWith("/housekeeping")) return "Housekeeping";
  if (pathname.startsWith("/check-in")) return "Report";

  for (const section of NAV_SECTIONS) {
    if (section.items.some((item) => isActivePath(pathname, item.path))) {
      return section.title;
    }
  }

  return "Report";
}
