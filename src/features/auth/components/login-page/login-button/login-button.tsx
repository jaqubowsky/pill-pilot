"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { GoogleIcon } from "./google-icon";
import { useLogin } from "./use-login";

type LoginButtonProps = {
	callbackUrl?: string;
};

export const LoginButton = ({ callbackUrl }: LoginButtonProps) => {
	const t = useTranslations();

	const { handleGoogleLogin, isLoading } = useLogin({ callbackUrl });

	return (
		<Button
			variant="outline"
			size="lg"
			onClick={handleGoogleLogin}
			disabled={isLoading}
			className="w-full min-h-12 gap-sm border-edge bg-surface-raised text-content shadow-sm active:bg-interactive-active active:scale-[0.97]"
		>
			{isLoading ? (
				<div className="size-5 animate-spin rounded-full border-2 border-content-muted border-t-transparent" />
			) : (
				<GoogleIcon className="size-5" />
			)}
			{t("auth.continueWithGoogle")}
		</Button>
	);
};
