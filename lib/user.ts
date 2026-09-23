import { cache } from "react";
import { getMe } from "@/api/user";
import type { MeResponseData } from "@/schema/user/user.schema";

export const getCurrentUser = cache(getMe);

export function isPrivilegedRole(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function canAccess(user: MeResponseData, page: string): boolean {
  return isPrivilegedRole(user.role) || user.permissions.includes(page);
}
