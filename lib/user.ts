import { cache } from "react";
import { getMe } from "@/api/user";

export const getCurrentUser = cache(getMe);

export { isPrivilegedRole, canAccess } from "@/lib/role";
