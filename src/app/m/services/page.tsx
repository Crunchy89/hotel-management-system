"use client";

import { useMemo } from "react";
import { LocaleToggleButton } from "@/components/common/LocaleToggleButton";
import { useT } from "@/context/LocaleContext";
import { formatCurrency } from "@/lib/metrics";
import type { HotelService, HotelServiceCategory } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const CATEGORY_ORDER: HotelServiceCategory[] = [
  "room_service",
  "dining",
  "spa",
  "laundry",
  "transfer",
  "other",
];

export default function MobileServicesPage() {
  const t = useT();
  const { hotel_services, loading } = useHotelData();

  const active = useMemo(
    () => hotel_services.filter((s) => s.active),
    [hotel_services],
  );

  const grouped = useMemo(() => {
    const map = new Map<HotelServiceCategory, HotelService[]>();
    for (const service of active) {
      const list = map.get(service.category) ?? [];
      list.push(service);
      map.set(service.category, list);
    }
    return CATEGORY_ORDER.filter((cat) => (map.get(cat)?.length ?? 0) > 0).map(
      (cat) => ({
        category: cat,
        items: (map.get(cat) ?? []).sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
        ),
      }),
    );
  }, [active]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-theme-lg dark:bg-gray-900">
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-theme-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                {t("mobileServices.hotel")}
              </p>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                {t("mobileServices.title")}
              </h1>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {t("mobileServices.subtitle")}
              </p>
            </div>
            <LocaleToggleButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-10">
          {loading ? (
            <p className="py-16 text-center text-theme-sm text-gray-500">
              {t("common.loading")}
            </p>
          ) : grouped.length === 0 ? (
            <p className="py-16 text-center text-theme-sm text-gray-500">
              {t("mobileServices.empty")}
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <section key={group.category}>
                  <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t(`services.category.${group.category}`)}
                  </h2>
                  <ul className="space-y-3">
                    {group.items.map((service) => (
                      <li
                        key={service.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white/90">
                              {service.name}
                            </h3>
                            {service.description ? (
                              <p className="mt-1 text-theme-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                {service.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-theme-sm font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                            {service.price > 0
                              ? formatCurrency(service.price)
                              : t("services.complimentary")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
