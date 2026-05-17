import { Resend } from "resend";
import { env } from "@/config/env";

export const isResendEnabled = !!(env.RESEND_API_KEY && env.EMAIL_FROM);

export const resendClient = isResendEnabled
  ? new Resend(env.RESEND_API_KEY)
  : null;
