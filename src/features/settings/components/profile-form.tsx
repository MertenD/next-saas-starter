"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateProfile } from "@/features/user/hooks/use-update-profile"

type User = {
  name: string
  email: string
  image: string | null
}

type ProfileFormProps = {
  user: User
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("settings.account.profile")
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const profileSchema = z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    image: z.union([z.url(t("validation.imageInvalid")), z.literal("")]),
  })
  type ProfileFormValues = z.infer<typeof profileSchema>

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, image: user.image ?? "" },
  })

  const imagePreview = form.watch("image")

  function onSubmit(values: ProfileFormValues) {
    updateProfile({ name: values.name, image: values.image || undefined })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={imagePreview || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {user.name[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{t("imageLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("imagePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label>{t("emailLabel")}</Label>
          <Input value={user.email} disabled />
          <p className="text-muted-foreground text-sm">
            {t("emailReadonlyHint")}
          </p>
        </div>
        <Button type="submit" disabled={isPending}>
          {t("saveButton")}
        </Button>
      </form>
    </Form>
  )
}
