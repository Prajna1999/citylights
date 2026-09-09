"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createSession, deleteSession, hashPassword, verifyPassword } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db";
import type { User } from "@/lib/types";

export type AuthFormState = { ok: boolean; message: string };

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const SignupSchema = z
  .object({
    businessName: z.string().trim().min(2, "Business name must be at least 2 characters."),
    email: z.email("Enter a valid email address.").trim().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    businessName: str(formData, "businessName"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { businessName, email, password } = parsed.data;
  if (await getUserByEmail(email)) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const user: User = {
    id: crypto.randomUUID(),
    businessName,
    email,
    passwordHash: hashPassword(password),
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  await createUser(user);
  await createSession(user);
  redirect("/admin");
}

const LoginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, message: "Invalid email or password." };
  }

  await createSession(user);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
