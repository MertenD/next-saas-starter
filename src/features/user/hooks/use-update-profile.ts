import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

type UpdateProfileInput = {
  name: string;
  image?: string;
};

export const useUpdateProfile = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const t = useTranslations("settings.account.profile");

  return useMutation({
    mutationFn: async (values: UpdateProfileInput) => {
      const { data, error } = await authClient.updateUser(values);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries(trpc.user.me.queryOptions());
    },
    onError: (err) => toast.error(err.message),
  });
};
