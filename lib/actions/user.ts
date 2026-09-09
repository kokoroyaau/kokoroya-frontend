"use server";

import {
  getUsers,
  getPermissions,
  createUser,
  updateUser,
  deleteUser,
  setUserPermissions,
  setUserBranches,
} from "@/api/user";
import type {
  CreateUserPayload,
  EditUserPayload,
} from "@/schema/user/user.schema";

function toNumberOrUndefined(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toPinOrUndefined(value: string) {
  return value === "" ? undefined : value;
}

// Next.js strips thrown error messages from Server Actions in production
// (shows a generic "React error #441" instead), so every mutating action
// returns errors as data via this wrapper instead of letting them throw.
async function withResult(fn: () => Promise<void>) {
  try {
    await fn();
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function getUsersAction() {
  return getUsers();
}

export async function getPermissionsAction() {
  return getPermissions();
}

export async function createUserAction(payload: CreateUserPayload) {
  return withResult(async () => {
    await createUser({
      ...payload,
      pin: toPinOrUndefined(payload.pin ?? ""),
      rate_weekday: toNumberOrUndefined(payload.rate_weekday),
      rate_weekend: toNumberOrUndefined(payload.rate_weekend),
      hour_cap_weekday: toNumberOrUndefined(payload.hour_cap_weekday),
      hour_cap_weekend: toNumberOrUndefined(payload.hour_cap_weekend),
    });
  });
}

export async function updateUserAction(id: number, payload: EditUserPayload) {
  const {
    permissions,
    branch_ids,
    rate_weekday,
    rate_weekend,
    hour_cap_weekday,
    hour_cap_weekend,
    pin,
    ...rest
  } = payload;
  return withResult(async () => {
    await updateUser(id, {
      ...rest,
      pin: toPinOrUndefined(pin),
      rate_weekday: toNumberOrUndefined(rate_weekday),
      rate_weekend: toNumberOrUndefined(rate_weekend),
      hour_cap_weekday: toNumberOrUndefined(hour_cap_weekday),
      hour_cap_weekend: toNumberOrUndefined(hour_cap_weekend),
    });
    await setUserPermissions(id, permissions);
    await setUserBranches(id, branch_ids);
  });
}

export async function toggleUserActiveAction(id: number, isActive: boolean) {
  return withResult(async () => {
    await updateUser(id, { is_active: isActive });
  });
}

export async function deleteUserAction(id: number) {
  return withResult(async () => {
    await deleteUser(id);
  });
}
