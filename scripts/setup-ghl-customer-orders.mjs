#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

const GHL_API_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

const OBJECT_KEY = "customer_orders";
const SCHEMA_KEY = `custom_objects.${OBJECT_KEY}`;
const ASSOCIATION_KEY = "contact_customer_orders";

const ORDER_FIELDS = [
  {
    key: "order_id",
    name: "Order ID",
    dataType: "TEXT",
    description: "Stripe payment intent ID",
    placeholder: "pi_...",
  },
  {
    key: "order_date",
    name: "Order Date",
    dataType: "DATE",
  },
  {
    key: "order_total",
    name: "Order Total",
    dataType: "MONETORY",
  },
  {
    key: "currency",
    name: "Currency",
    dataType: "TEXT",
    placeholder: "usd",
  },
  {
    key: "products",
    name: "Products",
    dataType: "LARGE_TEXT",
    description: "Line items purchased",
  },
  {
    key: "order_type",
    name: "Order Type",
    dataType: "SINGLE_OPTIONS",
    options: [
      { key: "one_time", label: "One-time" },
      { key: "subscription", label: "Subscription" },
      { key: "mixed", label: "Mixed" },
    ],
  },
  {
    key: "fulfillment_status",
    name: "Fulfillment Status",
    dataType: "TEXT",
    placeholder: "created",
  },
  {
    key: "roastify_order_id",
    name: "Roastify Order ID",
    dataType: "TEXT",
  },
  {
    key: "tracking_number",
    name: "Tracking Number",
    dataType: "TEXT",
  },
  {
    key: "tracking_url",
    name: "Tracking URL",
    dataType: "TEXT",
  },
  {
    key: "carrier",
    name: "Carrier",
    dataType: "TEXT",
  },
  {
    key: "shipping_address",
    name: "Shipping Address",
    dataType: "LARGE_TEXT",
  },
  {
    key: "stripe_customer_id",
    name: "Stripe Customer ID",
    dataType: "TEXT",
    placeholder: "cus_...",
  },
];

function buildHeaders(apiToken) {
  return {
    Authorization: `Bearer ${apiToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  };
}

async function ghlRequest(apiToken, path, options = {}) {
  const response = await fetch(`${GHL_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: buildHeaders(apiToken),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      data.message ||
      data.error ||
      (Array.isArray(data.message) ? data.message.join("; ") : null) ||
      `GoHighLevel API ${response.status} for ${path}`;
    const error = new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function isScopeError(error) {
  return (
    error.status === 401 &&
    String(error.message).toLowerCase().includes("not authorized for this scope")
  );
}

function printScopeHelp() {
  console.error("\nAdd these scopes to your GHL Private Integration, then re-run:");
  console.error("  objects/schema.readonly");
  console.error("  objects/schema.write");
  console.error("  locations/customFields.write");
  console.error("  associations.readonly");
  console.error("  associations.write");
  console.error("\nThen run: npm run ghl:setup:orders\n");
}

function normalizeObjects(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.objects)) {
    return payload.objects;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

function findCustomerOrdersObject(objects) {
  return objects.find((entry) => {
    const key = entry.key ?? entry.object?.key;
    return key === SCHEMA_KEY || key === OBJECT_KEY;
  });
}

async function listObjects(apiToken, locationId) {
  const data = await ghlRequest(
    apiToken,
    `/objects/?locationId=${encodeURIComponent(locationId)}`
  );
  return normalizeObjects(data);
}

async function getObjectSchema(apiToken, locationId) {
  return ghlRequest(
    apiToken,
    `/objects/${encodeURIComponent(SCHEMA_KEY)}?locationId=${encodeURIComponent(locationId)}&fetchProperties=true`
  );
}

async function createCustomerOrdersObject(apiToken, locationId) {
  return ghlRequest(apiToken, "/objects/", {
    method: "POST",
    body: {
      locationId,
      labels: {
        singular: "Customer Order",
        plural: "Customer Orders",
      },
      key: OBJECT_KEY,
      description: "RITUL website orders synced from Stripe",
      primaryDisplayPropertyDetails: {
        key: "order_id",
        name: "Order ID",
        dataType: "TEXT",
      },
    },
  });
}

async function listCustomFields(apiToken, locationId) {
  const data = await ghlRequest(
    apiToken,
    `/custom-fields/object-key/${encodeURIComponent(SCHEMA_KEY)}?locationId=${encodeURIComponent(locationId)}`
  );

  return {
    fields: Array.isArray(data.fields) ? data.fields : [],
    folders: Array.isArray(data.folders) ? data.folders : [],
  };
}

function fieldExists(existingFields, fieldKey) {
  const fullKey = `${SCHEMA_KEY}.${fieldKey}`;
  return existingFields.some((field) => {
    const key = field.fieldKey ?? field.key;
    return key === fullKey || key === fieldKey || key?.endsWith(`.${fieldKey}`);
  });
}

async function resolveFieldParentId(apiToken, locationId, existingFields) {
  const listed = await listCustomFields(apiToken, locationId);
  const folderId = listed.folders[0]?.id;
  if (folderId) {
    return folderId;
  }

  const parentId = existingFields.find((field) => field.parentId)?.parentId;
  if (parentId) {
    return parentId;
  }

  return locationId;
}

async function createOrderFields(apiToken, locationId, existingFields) {
  const parentId = await resolveFieldParentId(apiToken, locationId, existingFields);
  const created = [];

  for (const field of ORDER_FIELDS) {
    if (fieldExists(existingFields, field.key)) {
      continue;
    }

    const body = {
      locationId,
      objectKey: SCHEMA_KEY,
      parentId,
      name: field.name,
      description: field.description,
      placeholder: field.placeholder,
      showInForms: true,
      dataType: field.dataType,
      fieldKey: `${SCHEMA_KEY}.${field.key}`,
      ...(field.options ? { options: field.options } : {}),
    };

    const response = await ghlRequest(apiToken, "/custom-fields/", {
      method: "POST",
      body,
    });
    created.push(response.field ?? response);
  }

  return created;
}

function normalizeAssociations(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.associations)) {
    return payload.associations;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

async function listAssociations(apiToken, locationId) {
  const data = await ghlRequest(
    apiToken,
    `/associations/?locationId=${encodeURIComponent(locationId)}`
  );
  return normalizeAssociations(data);
}

function findContactOrdersAssociation(associations) {
  return associations.find((association) => {
    const keys = [
      association.key,
      association.firstObjectKey,
      association.secondObjectKey,
    ].filter(Boolean);

    if (association.key === ASSOCIATION_KEY) {
      return true;
    }

    return keys.includes("contact") && keys.includes(SCHEMA_KEY);
  });
}

async function createContactOrdersAssociation(apiToken, locationId) {
  return ghlRequest(apiToken, "/associations/", {
    method: "POST",
    body: {
      locationId,
      key: ASSOCIATION_KEY,
      firstObjectLabel: "Customer",
      firstObjectKey: "contact",
      secondObjectLabel: "Order",
      secondObjectKey: SCHEMA_KEY,
    },
  });
}

async function main() {
  loadProjectEnv();

  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;

  if (isPlaceholder(apiToken) || isPlaceholder(locationId)) {
    console.error("GHL_API_TOKEN and GHL_LOCATION_ID are required in .env.local");
    process.exit(1);
  }

  console.log("Setting up GoHighLevel Customer Orders custom object...\n");

  let objects;
  try {
    objects = await listObjects(apiToken, locationId);
  } catch (error) {
    if (isScopeError(error)) {
      console.error("Missing scope for listing objects.");
      printScopeHelp();
      process.exit(1);
    }
    throw error;
  }

  let objectCreated = false;
  if (!findCustomerOrdersObject(objects)) {
    console.log("→ Creating Customer Orders object...");
    try {
      await createCustomerOrdersObject(apiToken, locationId);
      objectCreated = true;
      console.log("✓ Customer Orders object created");
    } catch (error) {
      if (isScopeError(error)) {
        console.error("Missing scope for creating object schema.");
        printScopeHelp();
        process.exit(1);
      }
      throw error;
    }
  } else {
    console.log("✓ Customer Orders object already exists");
  }

  const schema = await getObjectSchema(apiToken, locationId);
  const object = schema.object ?? schema;
  console.log(`  Schema key: ${object.key ?? SCHEMA_KEY}`);
  if (object.id) {
    console.log(`  Schema id: ${object.id}`);
  }

  console.log("\n→ Ensuring order fields...");
  let existingFields = [];
  try {
    const listed = await listCustomFields(apiToken, locationId);
    existingFields = listed.fields;
  } catch (error) {
    if (!isScopeError(error)) {
      throw error;
    }
    console.log("  Skipped field listing (missing locations/customFields.write)");
  }

  try {
    const createdFields = await createOrderFields(apiToken, locationId, existingFields);
    if (createdFields.length > 0) {
      console.log(`✓ Created ${createdFields.length} custom field(s)`);
    } else {
      console.log("✓ Order fields already present");
    }
  } catch (error) {
    if (isScopeError(error)) {
      console.error("Missing scope for creating custom fields.");
      printScopeHelp();
      process.exit(1);
    }
    throw error;
  }

  console.log("\n→ Ensuring contact ↔ order association...");
  let associations = [];
  try {
    associations = await listAssociations(apiToken, locationId);
  } catch (error) {
    if (isScopeError(error)) {
      console.error("Missing scope for listing associations.");
      printScopeHelp();
      process.exit(1);
    }
    throw error;
  }

  let association = findContactOrdersAssociation(associations);
  if (!association) {
    try {
      association = await createContactOrdersAssociation(apiToken, locationId);
      console.log("✓ Contact ↔ Customer Orders association created");
    } catch (error) {
      if (isScopeError(error)) {
        console.error("Missing scope for creating associations.");
        printScopeHelp();
        process.exit(1);
      }
      throw error;
    }
  } else {
    console.log("✓ Contact ↔ Customer Orders association already exists");
  }

  const associationId = association.id ?? association.associationId;
  console.log("\nAdd these to .env.local:");
  console.log(`GHL_CUSTOMER_ORDERS_SCHEMA_KEY=${object.key ?? SCHEMA_KEY}`);
  if (associationId) {
    console.log(`GHL_CONTACT_ORDERS_ASSOCIATION_ID=${associationId}`);
  }

  console.log(
    `\nDone.${objectCreated ? " Customer Orders is ready in GHL." : ""} Next: wire order sync in the app after you confirm the object looks right in GHL.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  process.exit(1);
});
