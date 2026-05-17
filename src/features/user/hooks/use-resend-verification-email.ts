import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export const useResendVerificationEmail = () => {
  const t = useTranslations("settings.account.verification");

  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/settings?tab=account",
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(t("resendSuccess"));
    },
    onError: (err) => toast.error(err.message),
  });
};
