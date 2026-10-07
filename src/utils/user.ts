export const getDisplayName = (user?: { fullName?: string; email?: string } | null) =>
  user?.fullName || user?.email || "Người dùng";

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts.length > 1 ? parts[0][0] : "";
  const last = parts[parts.length - 1][0] ?? "?";
  return (first + last).toUpperCase();
};