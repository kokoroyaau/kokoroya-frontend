import type { MeResponseData } from "@/schema/user/user.schema";

export function isPrivilegedRole(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function canAccess(user: MeResponseData, page: string): boolean {
  return isPrivilegedRole(user.role) || user.permissions.includes(page);
}
