"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { GoogleIcon } from "../login-page/login-button/google-icon";
import { useShareLandingPage } from "./use-share-landing-page";

type ShareLandingPageProps = {
	token: string;
};

export function ShareLandingPage({ token }: ShareLandingPageProps) {
	const t = useTranslations();
	const { handleLogin, isLoading } = useShareLandingPage({ token });

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface px-md max-w-lg mx-auto gap-lg text-center">
			<div className="flex flex-col gap-sm">
				<h1 className="font-display text-2xl text-content">
					{t("settings.share.landingTitle")}
				</h1>
				<p className="text-base text-content-muted">{t("settings.share.landingDescription")}</p>
			</div>

			<Button
				variant="outline"
				size="lg"
				onClick={handleLogin}
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
		</div>
	);
}
