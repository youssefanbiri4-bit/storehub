import type { PostgrestError } from "@supabase/supabase-js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getStringProperty(
  value: UnknownRecord,
  key: string
): string | undefined {
  return typeof value[key] === "string" ? (value[key] as string) : undefined;
}

function getNumberProperty(
  value: UnknownRecord,
  key: string
): number | undefined {
  return typeof value[key] === "number" ? (value[key] as number) : undefined;
}

export type NormalizedDatabaseError = {
  name?: string;
  code?: string;
  message: string;
  details?: unknown;
  hint?: string;
  status?: number;
  type: string;
  keys: string[];
  stack?: string;
};

export function normalizeDatabaseError(
  error: unknown
): NormalizedDatabaseError {
  const record = isRecord(error) ? error : {};
  const message =
    getStringProperty(record, "message") ??
    (error instanceof Error ? error.message : undefined) ??
    (typeof error === "string" ? error : undefined) ??
    "Unknown database error";
  return {
    name:
      getStringProperty(record, "name") ??
      (error instanceof Error ? error.name : undefined),
    code: getStringProperty(record, "code"),
    message,
    details: record.details,
    hint: getStringProperty(record, "hint"),
    status:
      getNumberProperty(record, "status") ??
      getNumberProperty(record, "statusCode"),
    type: Object.prototype.toString.call(error),
    keys: Object.keys(record),
    stack: error instanceof Error ? error.stack : undefined,
  };
}

export function logDatabaseError(
  operation: string,
  error: unknown
): void {
  const normalized = normalizeDatabaseError(error);

  console.error(
    `[Database] ${operation} | code=${normalized.code ?? "UNKNOWN"} | message=${normalized.message} | details=${String(normalized.details ?? "")} | hint=${normalized.hint ?? ""}`
  );
}

export function isPostgrestError(
  error: unknown
): error is PostgrestError {
  if (!isRecord(error)) {
    return false;
  }
  return (
    typeof error.code === "string" &&
    typeof error.message === "string" &&
    "details" in error &&
    "hint" in error
  );
}

export function getSafeDatabaseErrorMessage(code?: string): string {
  switch (code) {
    case "23505":
      return "This record already exists.";
    case "23503":
      return "Cannot complete this action — it is linked to other data.";
    case "23502":
      return "Some required fields are missing.";
    case "42501":
      return "You don't have permission to perform this action.";
    case "42P01":
      return "The requested table could not be found.";
    case "42703":
      return "There is a mismatch between the app and the database schema.";
    case "PGRST116":
      return "The requested record was not found.";
    default:
      return "Something went wrong while connecting to the database.";
  }
}
