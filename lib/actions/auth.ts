"use server";

import { redirect } from "next/navigation";
import { postLogin, postLogout } from "@/api/auth";
import type { LoginPayload } from "@/schema/auth/auth.schema";
import { setToken, clearToken, clearSelectedBranch } from "@/lib/auth";

export async function loginAction(payload: LoginPayload) {
  
  
  try {
    const data = await postLogin(payload);
    await setToken(data.access_token);
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function logoutAction() {
  try {
    await postLogout();
  } finally {
    await clearToken();
    await clearSelectedBranch();
  }
  redirect("/sign-in");
}
