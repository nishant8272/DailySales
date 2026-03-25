import { HttpError } from "./http-error";

// Validate YYYY-MM-DD date param 
export const validateDateParam = (date: string): void => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new HttpError(400,"Date must be in YYYY-MM-DD format");
  }
};

// Validate year + month query params 
export const validateYearMonth = (
  year: unknown,
  month: unknown
): { year: number; month: number } => {
  const errors: string[] = [];

  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (!year || isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2100) {
    errors.push("year must be a valid number (e.g. 2026).");
  }

  if (!month || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    errors.push("month must be between 1 and 12.");
  }

  if (errors.length > 0) {
    throw new HttpError(400, errors.join(" "));
  }

  return { year: parsedYear, month: parsedMonth };
};

// Validate from/to date range
export const validateDateRange = (from: any, to: any): { from: string; to: string } => {
  const errors: string[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!from || typeof from !== "string" || !dateRegex.test(from)) {
    errors.push("from must be a valid date in YYYY-MM-DD format.");
  }

  if (!to || typeof to !== "string" || !dateRegex.test(to)) {
    errors.push("to must be a valid date in YYYY-MM-DD format.");
  }

  if (errors.length === 0 && from > to) {
    errors.push("from date cannot be after to date.");
  }

  if (errors.length > 0) {
    throw new HttpError(400, errors.join(" "));
  }

  return { from: from as string, to: to as string };
};