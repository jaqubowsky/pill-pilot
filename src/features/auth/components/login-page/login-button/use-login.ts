"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";

export function useLogin({ callbackUrl }: { callbackUrl?: string } = {}) {
	const t = useTranslations();
	const [isLoading, setIsLoading] = useState(false);

	async function handleGoogleLogin() {
		if (isLoading) return;
		setIsLoading(true);
		try {
			if (callbackUrl) {
				localStorage.setItem("post_auth_redirect", callbackUrl);
			}
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
			});
		} catch {
			setIsLoading(false);
			toast.error(t("auth.loginError"));
		}
	}

	return { handleGoogleLogin, isLoading };
}
