import { getSalesforceApiVersion } from "@/lib/salesforce/config";
import { getSalesforceSession, type SalesforceSession } from "@/lib/salesforce/auth";

interface SalesforceQueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
}

interface SalesforceCreateResult {
  id: string;
  success: boolean;
  errors?: Array<{ message: string }>;
}

interface SalesforceErrorBody {
  message?: string;
  errorCode?: string;
  error?: string;
  error_description?: string;
}

export class SalesforceApiError extends Error {
  readonly status: number;
  readonly details: SalesforceErrorBody | string;

  constructor(status: number, details: SalesforceErrorBody | string) {
    const message =
      typeof details === "string"
        ? details
        : details.message ||
          details.error_description ||
          details.error ||
          "Salesforce API request failed";
    super(message);
    this.name = "SalesforceApiError";
    this.status = status;
    this.details = details;
  }
}

async function salesforceRequest<T>(
  session: SalesforceSession,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${session.instanceUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new SalesforceApiError(
      response.status,
      parsed as SalesforceErrorBody | string
    );
  }

  return parsed as T;
}

export async function querySalesforce<T extends Record<string, unknown>>(
  soql: string
): Promise<T[]> {
  const session = await getSalesforceSession();
  const encoded = encodeURIComponent(soql);
  const result = await salesforceRequest<SalesforceQueryResult<T>>(
    session,
    `/services/data/${getSalesforceApiVersion()}/query?q=${encoded}`
  );

  return result.records;
}

export async function createSalesforceRecord(
  objectName: string,
  fields: Record<string, unknown>
): Promise<string> {
  const session = await getSalesforceSession();
  const result = await salesforceRequest<SalesforceCreateResult>(
    session,
    `/services/data/${getSalesforceApiVersion()}/sobjects/${objectName}`,
    {
      method: "POST",
      body: JSON.stringify(fields),
    }
  );

  if (!result.success) {
    throw new SalesforceApiError(
      400,
      result.errors?.map((entry) => entry.message).join("; ") || "Create failed"
    );
  }

  return result.id;
}

export async function updateSalesforceRecord(
  objectName: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const session = await getSalesforceSession();
  await salesforceRequest<Record<string, never>>(
    session,
    `/services/data/${getSalesforceApiVersion()}/sobjects/${objectName}/${recordId}`,
    {
      method: "PATCH",
      body: JSON.stringify(fields),
    }
  );
}

export async function getSalesforceOrganization(): Promise<{
  id: string;
  name: string;
  organizationType?: string;
  instanceName?: string;
}> {
  const records = await querySalesforce<{
    Id: string;
    Name: string;
    OrganizationType?: string;
    InstanceName?: string;
  }>("SELECT Id, Name, OrganizationType, InstanceName FROM Organization LIMIT 1");

  const organization = records[0];
  if (!organization) {
    throw new Error("Could not load Salesforce organization details");
  }

  return {
    id: organization.Id,
    name: organization.Name,
    organizationType: organization.OrganizationType,
    instanceName: organization.InstanceName,
  };
}
