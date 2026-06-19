export const orderTableClass = "w-full table-fixed text-left";

export const orderTableHeaderClass =
  "px-5 py-3 text-xs tracking-[0.14em] uppercase text-text-muted font-medium";
export const orderTableCellClass =
  "px-5 py-4 align-top text-sm text-text-secondary";

export const ordersPanelColumnWidths = {
  customer: "w-[17%]",
  items: "w-[19%]",
  date: "w-[14%]",
  total: "w-[7%]",
  type: "w-[10%]",
  progress: "w-[10%]",
  tracking: "w-[14%]",
  orderId: "w-[9%]",
} as const;

export const wholesalePanelColumnWidths = {
  customer: "w-[18%]",
  company: "w-[14%]",
  items: "w-[22%]",
  date: "w-[14%]",
  progress: "w-[10%]",
  tracking: "w-[14%]",
  orderId: "w-[7%]",
} as const;

export const orderHistoryColumnWidths = {
  items: "w-[20%]",
  date: "w-[15%]",
  total: "w-[8%]",
  type: "w-[11%]",
  progress: "w-[12%]",
  tracking: "w-[22%]",
  orderId: "w-[12%]",
} as const;
