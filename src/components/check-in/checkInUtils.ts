export type CheckInReportRow = {
  id: string;
  reservationNumber: string;
  invoiceNumber: string;
  guestName: string;
  date: string;
  lengthOfStay: number;
  roomNumber: string;
  adults: number;
  children: number;
  infants: number;
  extraPerson: number;
  outstandingBalance: number;
  totalAmount: number;
  eta: string;
  notes: string;
};

export const CHECK_IN_DUMMY: CheckInReportRow[] = [
  {
    id: "ci-1",
    reservationNumber: "FC2-5cb5e4dd-b40a-4103-b2bb-c6f60d78a70e-2",
    invoiceNumber: "",
    guestName: "Jones, Amelia",
    date: "2025-09-11",
    lengthOfStay: 4,
    roomNumber: "Room 3",
    adults: 1,
    children: 0,
    infants: 0,
    extraPerson: 0,
    outstandingBalance: 240,
    totalAmount: 240,
    eta: "",
    notes: "",
  },
  {
    id: "ci-2",
    reservationNumber: "FC1-983662a8-3eec-4082-8bb4-f65dd4304294-1",
    invoiceNumber: "",
    guestName: "Moore, Thomas",
    date: "2025-09-11",
    lengthOfStay: 3,
    roomNumber: "Room 5",
    adults: 1,
    children: 0,
    infants: 0,
    extraPerson: 0,
    outstandingBalance: 410,
    totalAmount: 410,
    eta: "",
    notes: "",
  },
  {
    id: "ci-3",
    reservationNumber: "FC1-1aa58c43-7639-44e0-8a54-b77157b2b01d",
    invoiceNumber: "",
    guestName: "Lee, Amelia",
    date: "2025-09-11",
    lengthOfStay: 3,
    roomNumber: "Room 15",
    adults: 1,
    children: 0,
    infants: 0,
    extraPerson: 0,
    outstandingBalance: 2051,
    totalAmount: 2051,
    eta: "",
    notes: "",
  },
];

export const CHECK_OUT_DUMMY: CheckInReportRow[] = [
  {
    id: "co-1",
    reservationNumber: "FC2-5be2c35a-3c30-4d32-8f3d-69d38ecb4951-2",
    invoiceNumber: "",
    guestName: "Jones, Thomas",
    date: "2025-09-11",
    lengthOfStay: 3,
    roomNumber: "Room 12",
    adults: 1,
    children: 0,
    infants: 0,
    extraPerson: 0,
    outstandingBalance: 384,
    totalAmount: 384,
    eta: "",
    notes: "",
  },
  {
    id: "co-2",
    reservationNumber: "FC1-27a01cf8-c38f-4a2b-9d1e-6f8a3b2c4d5e",
    invoiceNumber: "",
    guestName: "Smith, Olivia",
    date: "2025-09-11",
    lengthOfStay: 2,
    roomNumber: "Room 8",
    adults: 2,
    children: 1,
    infants: 0,
    extraPerson: 0,
    outstandingBalance: 520,
    totalAmount: 520,
    eta: "",
    notes: "",
  },
  {
    id: "co-3",
    reservationNumber: "FC2-8f4e2a1b-9c3d-4e5f-a6b7-c8d9e0f1a2b3",
    invoiceNumber: "",
    guestName: "Brown, James",
    date: "2025-09-11",
    lengthOfStay: 5,
    roomNumber: "Room 2",
    adults: 1,
    children: 0,
    infants: 0,
    extraPerson: 1,
    outstandingBalance: 890,
    totalAmount: 890,
    eta: "",
    notes: "Late checkout requested",
  },
];

export function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function formatReportDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function filterByDateRange(
  rows: CheckInReportRow[],
  from: string,
  to: string,
): CheckInReportRow[] {
  return rows.filter((row) => row.date >= from && row.date <= to);
}

export function exportReportCsv(
  rows: CheckInReportRow[],
  type: "check-in" | "check-out",
  dateFrom: string,
  dateTo: string,
) {
  downloadCsv(buildCsvLines(rows, type), `${type}-report-${dateFrom}-to-${dateTo}.csv`);
}

export function exportCheckInCsv(
  checkIns: CheckInReportRow[],
  checkOuts: CheckInReportRow[],
  dateFrom: string,
  dateTo: string,
) {
  const checkInLines = buildCsvLines(checkIns, "Check-in");
  const checkOutLines = buildCsvLines(checkOuts, "Check-out").slice(1);
  downloadCsv(
    [checkInLines[0]!, ...checkInLines.slice(1), ...checkOutLines],
    `arrivals-departures-${dateFrom}-to-${dateTo}.csv`,
  );
}

function buildCsvLines(rows: CheckInReportRow[], type: string): string[] {
  const headers = [
    "Type",
    "Reservation number",
    "Invoice number",
    "Guest name",
    "Date",
    "LoS",
    "Room",
    "Adults",
    "Children",
    "Infants",
    "Extra person",
    "Outstanding",
    "Total",
    "ETA",
    "Notes",
  ];

  const rowToLine = (row: CheckInReportRow) =>
    [
      type,
      row.reservationNumber,
      row.invoiceNumber,
      row.guestName,
      row.date,
      row.lengthOfStay,
      row.roomNumber,
      row.adults,
      row.children,
      row.infants,
      row.extraPerson,
      row.outstandingBalance,
      row.totalAmount,
      row.eta,
      row.notes,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");

  return [headers.join(","), ...rows.map(rowToLine)];
}

function downloadCsv(lines: string[], filename: string) {
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildReportTableHtml(
  title: string,
  rows: CheckInReportRow[],
  dateLabel: string,
  showEta: boolean,
  withSectionHeading = true,
): string {
  const cols = showEta
    ? [
        "Reservation number",
        "Invoice number",
        "Guest name",
        dateLabel,
        "LoS",
        "Room number",
        "Adults / Children / Infants",
        "Extra person",
        "Outstanding balance",
        "Total amount",
        "ETA",
        "Notes",
      ]
    : [
        "Reservation number",
        "Invoice number",
        "Guest name",
        dateLabel,
        "LoS",
        "Room number",
        "Adults / Children / Infants",
        "Extra person",
        "Outstanding balance",
        "Total amount",
        "Notes",
      ];

  const head = cols.map((c) => `<th>${c}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = [
        row.reservationNumber,
        row.invoiceNumber || "—",
        row.guestName,
        formatReportDate(row.date),
        row.lengthOfStay,
        row.roomNumber,
        `${row.adults} / ${row.children} / ${row.infants}`,
        row.extraPerson,
        formatEuro(row.outstandingBalance),
        formatEuro(row.totalAmount),
        ...(showEta ? [row.eta || "—"] : []),
        row.notes || "—",
      ];
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    })
    .join("");

  const heading = withSectionHeading
    ? `<h2 style="font-size:16px;margin:24px 0 8px;">${title}</h2>`
    : "";

  return `${heading}
    <table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length}">No records</td></tr>`}</tbody></table>`;
}

export function printReport(
  title: string,
  rows: CheckInReportRow[],
  dateLabel: string,
  showEta: boolean,
  dateFrom: string,
  dateTo: string,
) {
  const rangeLabel = `${formatReportDate(dateFrom)} – ${formatReportDate(dateTo)}`;
  const html = `<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { margin: 0 0 16px; color: #666; font-size: 13px; }
      h2:first-of-type { margin-top: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
      th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
      th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; }
      tr:nth-child(even) { background: #f9fafb; }
    </style></head><body>
    <h1>${title}</h1>
    <p>${rangeLabel}</p>
    ${buildReportTableHtml(title, rows, dateLabel, showEta, false)}
    </body></html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function printBothReports(
  checkIns: CheckInReportRow[],
  checkOuts: CheckInReportRow[],
  dateFrom: string,
  dateTo: string,
) {
  const rangeLabel = `${formatReportDate(dateFrom)} – ${formatReportDate(dateTo)}`;
  const html = `<!DOCTYPE html><html><head><title>Check-In & Check-Out Report</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { margin: 0 0 16px; color: #666; font-size: 13px; }
      h2 { font-size: 16px; margin: 24px 0 8px; }
      h2:first-of-type { margin-top: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
      th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
      th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; }
      tr:nth-child(even) { background: #f9fafb; }
    </style></head><body>
    <h1>Check-In & Check-Out Report</h1>
    <p>${rangeLabel}</p>
    ${buildReportTableHtml("Check-In", checkIns, "Check-In", true)}
    ${buildReportTableHtml("Check-Out", checkOuts, "Check-Out", false)}
    </body></html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}