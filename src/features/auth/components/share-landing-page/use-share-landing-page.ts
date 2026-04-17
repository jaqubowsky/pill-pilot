"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";

export function useShareLandingPage({ token }: { token: string }) {
	const t = useTranslations();
	const [isLoading, setIsLoading] = useState(false);

	async function handleLogin() {
		if (isLoading) return;
		setIsLoading(true);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: `/share/${token}`,
			});
		} catch {
			setIsLoading(false);
			toast.error(t("auth.loginError"));
		}
	}

	return { handleLogin, isLoading };
}
