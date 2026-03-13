"use client";

import { useState } from "react";
import { authClient } from "@/shared/lib/auth-client";

export function useLogin() {
	const [isLoading, setIsLoading] = useState(false);

	async function handleGoogleLogin() {
		if (isLoading) return;
		setIsLoading(true);
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/onboarding",
		});
	}

	return { handleGoogleLogin, isLoading };
}
