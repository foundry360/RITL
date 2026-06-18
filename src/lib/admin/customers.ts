import type Stripe from "stripe";
import {
  buildAdminOrdersFromPaymentIntents,
  type AdminOrderRow,
} from "@/lib/admin/orders";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export interface AdminCustomerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string;
  createdAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  billingAddress?: AdminCustomerAddress;
  shippingAddress?: AdminCustomerAddress;
  orders: AdminOrderRow[];
}

function formatLocation(address?: Stripe.Address | null): string | undefined {
  if (!address) {
    return undefined;
  }

  const cityState = [address.city, address.state].filter(Boolean).join(", ");
  if (cityState) {
    return cityState;
  }

  return address.country ?? undefined;
}

function toAdminAddress(
  address?: Stripe.Address | null
): AdminCustomerAddress | undefined {
  if (!address?.line1) {
    return undefined;
  }

  return {
    line1: address.line1 ?? undefined,
    line2: address.line2 ?? undefined,
    city: address.city ?? undefined,
    state: address.state ?? undefined,
    postalCode: address.postal_code ?? undefined,
    country: address.country ?? undefined,
  };
}

function formatAddressLines(address?: AdminCustomerAddress): string | undefined {
  if (!address?.line1) {
    return undefined;
  }

  const lines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);

  return lines.join("\n");
}

export function formatAdminCustomerAddress(
  address?: AdminCustomerAddress
): string | undefined {
  return formatAddressLines(address);
}

function getCustomerIdFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): string | undefined {
  if (typeof paymentIntent.customer === "string") {
    return paymentIntent.customer;
  }

  return paymentIntent.customer?.id;
}

function buildCustomerSummary(
  customer: Stripe.Customer,
  stats: {
    orderCount: number;
    totalSpent: number;
    lastOrderAt?: string;
  }
): AdminCustomerSummary {
  const location =
    formatLocation(customer.shipping?.address) ??
    formatLocation(customer.address);

  return {
    id: customer.id,
    name: customer.name ?? customer.email ?? "Customer",
    email: customer.email ?? "—",
    phone: customer.phone ?? undefined,
    location,
    orderCount: stats.orderCount,
    totalSpent: stats.totalSpent,
    lastOrderAt: stats.lastOrderAt,
    createdAt: new Date(customer.created * 1000).toISOString(),
  };
}

function aggregateCustomerStats(
  paymentIntents: Stripe.PaymentIntent[]
): Map<
  string,
  {
    orderCount: number;
    totalSpent: number;
    lastOrderAt?: string;
  }
> {
  const stats = new Map<
    string,
    {
      orderCount: number;
      totalSpent: number;
      lastOrderAt?: string;
    }
  >();

  for (const paymentIntent of paymentIntents) {
    if (paymentIntent.status !== "succeeded") {
      continue;
    }

    const customerId = getCustomerIdFromPaymentIntent(paymentIntent);
    if (!customerId) {
      continue;
    }

    const createdAt = new Date(paymentIntent.created * 1000).toISOString();
    const current = stats.get(customerId) ?? {
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: undefined,
    };

    current.orderCount += 1;
    current.totalSpent += paymentIntent.amount;

    if (!current.lastOrderAt || createdAt > current.lastOrderAt) {
      current.lastOrderAt = createdAt;
    }

    stats.set(customerId, current);
  }

  return stats;
}

export const ADMIN_CUSTOMER_PAGE_SIZES = [25, 50, 75, 100] as const;
export type AdminCustomerPageSize = (typeof ADMIN_CUSTOMER_PAGE_SIZES)[number];
export const DEFAULT_ADMIN_CUSTOMER_PAGE_SIZE: AdminCustomerPageSize = 25;

export const ADMIN_CUSTOMER_SORT_FIELDS = [
  "name",
  "email",
  "phone",
  "location",
  "orderCount",
  "totalSpent",
  "lastOrderAt",
] as const;
export type AdminCustomerSortField = (typeof ADMIN_CUSTOMER_SORT_FIELDS)[number];
export type AdminCustomerSortDirection = "asc" | "desc";
export const DEFAULT_ADMIN_CUSTOMER_SORT_FIELD: AdminCustomerSortField =
  "lastOrderAt";
export const DEFAULT_ADMIN_CUSTOMER_SORT_DIRECTION: AdminCustomerSortDirection =
  "desc";

export interface AdminCustomersListResult {
  customers: AdminCustomerSummary[];
  total: number;
  page: number;
  pageSize: AdminCustomerPageSize;
  totalPages: number;
  sortBy: AdminCustomerSortField;
  sortDir: AdminCustomerSortDirection;
}

export interface ListAdminCustomersOptions {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

function normalizePageSize(pageSize?: number): AdminCustomerPageSize {
  if (
    pageSize === 25 ||
    pageSize === 50 ||
    pageSize === 75 ||
    pageSize === 100
  ) {
    return pageSize;
  }

  return DEFAULT_ADMIN_CUSTOMER_PAGE_SIZE;
}

function normalizePage(page?: number): number {
  if (!page || !Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function normalizeSortField(sortBy?: string): AdminCustomerSortField {
  if (
    sortBy &&
    ADMIN_CUSTOMER_SORT_FIELDS.includes(sortBy as AdminCustomerSortField)
  ) {
    return sortBy as AdminCustomerSortField;
  }

  return DEFAULT_ADMIN_CUSTOMER_SORT_FIELD;
}

function normalizeSortDirection(sortDir?: string): AdminCustomerSortDirection {
  return sortDir === "asc" ? "asc" : "desc";
}

function compareStrings(
  left?: string,
  right?: string,
  emptyLast = false
): number {
  const leftValue = left?.trim() ?? "";
  const rightValue = right?.trim() ?? "";

  if (emptyLast) {
    if (!leftValue && !rightValue) {
      return 0;
    }

    if (!leftValue) {
      return 1;
    }

    if (!rightValue) {
      return -1;
    }
  }

  return leftValue.localeCompare(rightValue, undefined, {
    sensitivity: "base",
  });
}

function sortAdminCustomers(
  customers: AdminCustomerSummary[],
  sortBy: AdminCustomerSortField,
  sortDir: AdminCustomerSortDirection
): AdminCustomerSummary[] {
  const direction = sortDir === "asc" ? 1 : -1;

  return [...customers].sort((left, right) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = compareStrings(left.name, right.name);
        break;
      case "email":
        comparison = compareStrings(left.email, right.email);
        break;
      case "phone":
        comparison = compareStrings(left.phone, right.phone, true);
        break;
      case "location":
        comparison = compareStrings(left.location, right.location, true);
        break;
      case "orderCount":
        comparison = left.orderCount - right.orderCount;
        break;
      case "totalSpent":
        comparison = left.totalSpent - right.totalSpent;
        break;
      case "lastOrderAt":
        comparison = compareStrings(
          left.lastOrderAt,
          right.lastOrderAt,
          true
        );
        break;
    }

    if (comparison === 0) {
      comparison = compareStrings(left.name, right.name);
    }

    return comparison * direction;
  });
}

function filterAdminCustomers(
  customers: AdminCustomerSummary[],
  query?: string
): AdminCustomerSummary[] {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return customers;
  }

  return customers.filter((customer) => {
    const haystack = [
      customer.name,
      customer.email,
      customer.phone,
      customer.location,
      customer.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

async function listAllStripeCustomers(): Promise<Stripe.Customer[]> {
  const stripe = getStripe();
  const customers: Stripe.Customer[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.customers.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const customer of page.data) {
      if (!("deleted" in customer && customer.deleted)) {
        customers.push(customer);
      }
    }

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return customers;
}

async function listAllSucceededPaymentIntents(): Promise<Stripe.PaymentIntent[]> {
  const stripe = getStripe();
  const paymentIntents: Stripe.PaymentIntent[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.paymentIntents.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const paymentIntent of page.data) {
      if (paymentIntent.status === "succeeded") {
        paymentIntents.push(paymentIntent);
      }
    }

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return paymentIntents;
}

export async function listAdminCustomers(
  options: ListAdminCustomersOptions = {}
): Promise<AdminCustomersListResult> {
  if (!isStripeSecretConfigured()) {
    return {
      customers: [],
      total: 0,
      page: 1,
      pageSize: DEFAULT_ADMIN_CUSTOMER_PAGE_SIZE,
      totalPages: 0,
      sortBy: DEFAULT_ADMIN_CUSTOMER_SORT_FIELD,
      sortDir: DEFAULT_ADMIN_CUSTOMER_SORT_DIRECTION,
    };
  }

  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize);
  const sortBy = normalizeSortField(options.sortBy);
  const sortDir = normalizeSortDirection(options.sortDir);

  const [stripeCustomers, paymentIntents] = await Promise.all([
    listAllStripeCustomers(),
    listAllSucceededPaymentIntents(),
  ]);

  const statsByCustomer = aggregateCustomerStats(paymentIntents);
  const allCustomers = stripeCustomers.map((customer) =>
    buildCustomerSummary(
      customer,
      statsByCustomer.get(customer.id) ?? {
        orderCount: 0,
        totalSpent: 0,
      }
    )
  );

  const filteredCustomers = filterAdminCustomers(allCustomers, options.query);
  const sortedCustomers = sortAdminCustomers(
    filteredCustomers,
    sortBy,
    sortDir
  );
  const total = sortedCustomers.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const customers = sortedCustomers.slice(startIndex, startIndex + pageSize);

  return {
    customers,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    sortBy,
    sortDir,
  };
}

export async function getAdminCustomer(
  customerId: string
): Promise<AdminCustomerDetail | null> {
  if (!isStripeSecretConfigured()) {
    return null;
  }

  const stripe = getStripe();

  let customer: Stripe.Customer | Stripe.DeletedCustomer;
  try {
    customer = await stripe.customers.retrieve(customerId);
  } catch {
    return null;
  }

  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  const paymentIntents = await stripe.paymentIntents.list({
    customer: customerId,
    limit: 100,
    expand: ["data.customer"],
  });

  const orders = await buildAdminOrdersFromPaymentIntents(paymentIntents.data);

  return {
    id: customer.id,
    name: customer.name ?? customer.email ?? "Customer",
    email: customer.email ?? "—",
    phone: customer.phone ?? undefined,
    createdAt: new Date(customer.created * 1000).toISOString(),
    billingAddress: toAdminAddress(customer.address),
    shippingAddress: toAdminAddress(customer.shipping?.address),
    orders,
  };
}
