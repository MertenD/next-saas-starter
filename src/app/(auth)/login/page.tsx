import LoginForm from "@/features/auth/login-form";
import { requireUnauth } from "@/lib/auth-utils";

export default async function LoginPage() {
  await requireUnauth();
  return <LoginForm />;
}
