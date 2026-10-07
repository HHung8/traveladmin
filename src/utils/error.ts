export const getErrorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0] ||
  err?.message ||
  fallback;
 