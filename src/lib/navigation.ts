export type NavItem = {
  /** i18n message key, e.g. nav.dashboard */
  labelKey: string;
  path: string;
};

export type NavSection = {
  id: string;
  titleKey: string;
  items: NavItem[];
};

export const TOP_NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/" },
  { labelKey: "nav.insights", path: "/insights" },
  { labelKey: "nav.reservations", path: "/reservations" },
  { labelKey: "nav.manageRoom", path: "/rooms" },
  { labelKey: "nav.roomsPrices", path: "/rates" },
  { labelKey: "nav.guests", path: "/guests" },
  { labelKey: "nav.guestMessages", path: "/messages" },
  { labelKey: "nav.clientChat", path: "/chat" },
  { labelKey: "nav.housekeeping", path: "/housekeeping" },
  { labelKey: "nav.hotelServices", path: "/services" },
];

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "report",
    titleKey: "nav.report",
    items: [
      { labelKey: "nav.checkIn", path: "/check-in" },
      { labelKey: "nav.bookingActivity", path: "/booking-activity" },
    ],
  },
  {
    id: "channel-manager",
    titleKey: "nav.channelManager",
    items: [
      { labelKey: "nav.channelManager", path: "/channel-manager" },
      { labelKey: "nav.channels", path: "/channels" },
      { labelKey: "nav.yieldRules", path: "/yield-rules" },
    ],
  },
];

export const ROUTE_LABEL_KEYS: Record<string, string> = {
  "/": "nav.dashboard",
  "/reservations": "nav.reservations",
  "/calendar": "nav.reservations",
  "/rooms": "nav.manageRoom",
  "/housekeeping": "nav.housekeeping",
  "/rates": "nav.roomsPrices",
  "/guests": "nav.guests",
  "/channels": "nav.channels",
  "/channel-manager": "nav.channelManager",
  "/yield-rules": "nav.yieldRules",
  "/insights": "nav.insights",
  "/messages": "nav.guestMessages",
  "/chat": "nav.clientChat",
  "/booking-activity": "nav.bookingActivity",
  "/check-in": "nav.checkIn",
  "/login": "login.title",
  "/services": "nav.hotelServices",
  "/m/services": "nav.hotelServices",
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

export function routeLabelKey(pathname: string): string {
  if (ROUTE_LABEL_KEYS[pathname]) return ROUTE_LABEL_KEYS[pathname]!;
  for (const [path, key] of Object.entries(ROUTE_LABEL_KEYS)) {
    if (path !== "/" && pathname.startsWith(path)) return key;
  }
  return "nav.hmsHotel";
}

export function routeSectionKey(pathname: string): string {
  if (pathname === "/") return "nav.dashboard";
  if (pathname.startsWith("/insights")) return "nav.insights";
  if (pathname.startsWith("/reservations") || pathname.startsWith("/calendar")) {
    return "nav.reservations";
  }
  if (pathname.startsWith("/rooms")) return "nav.manageRoom";
  if (pathname.startsWith("/rates")) return "nav.roomsPrices";
  if (pathname.startsWith("/guests")) return "nav.guests";
  if (pathname.startsWith("/messages")) return "nav.guestMessages";
  if (pathname.startsWith("/chat")) return "nav.clientChat";
  if (pathname.startsWith("/housekeeping")) return "nav.housekeeping";
  if (pathname.startsWith("/services") || pathname.startsWith("/m/services")) {
    return "nav.hotelServices";
  }
  if (pathname.startsWith("/check-in") || pathname.startsWith("/booking-activity")) {
    return "nav.report";
  }

  for (const section of NAV_SECTIONS) {
    if (section.items.some((item) => isActivePath(pathname, item.path))) {
      return section.titleKey;
    }
  }

  return "nav.report";
}

/** @deprecated Prefer routeLabelKey + t() */
export function routeLabel(pathname: string): string {
  const key = routeLabelKey(pathname);
  const fallback: Record<string, string> = {
    "nav.dashboard": "Dashboard",
    "nav.reservations": "Reservations",
    "nav.manageRoom": "Manage Room",
    "nav.housekeeping": "Housekeeping",
    "nav.roomsPrices": "Rooms & Prices",
    "nav.guests": "Guests",
    "nav.channels": "Channels",
    "nav.channelManager": "Channel manager",
    "nav.yieldRules": "Yield Rules",
    "nav.insights": "Insights",
    "nav.guestMessages": "Guest messages",
    "nav.clientChat": "Client chat",
    "nav.bookingActivity": "Booking activity",
    "nav.checkIn": "Check-In",
    "nav.hmsHotel": "HMS Hotel",
  };
  return fallback[key] ?? "HMS Hotel";
}

/** @deprecated Prefer routeSectionKey + t() */
export function routeSection(pathname: string): string {
  const key = routeSectionKey(pathname);
  const fallback: Record<string, string> = {
    "nav.dashboard": "Dashboard",
    "nav.insights": "Insights",
    "nav.reservations": "Reservations",
    "nav.manageRoom": "Manage Room",
    "nav.roomsPrices": "Rooms & Prices",
    "nav.guests": "Guests",
    "nav.guestMessages": "Guest messages",
    "nav.clientChat": "Client chat",
    "nav.housekeeping": "Housekeeping",
    "nav.report": "Report",
    "nav.channelManager": "Channel manager",
  };
  return fallback[key] ?? "Report";
}
