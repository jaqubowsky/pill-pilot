"use client";

import { Pill } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { GoogleIcon } from "./google-icon";
import { useLogin } from "./use-login";

export function LoginPage() {
	const t = useTranslations();

	const { handleGoogleLogin, isLoading } = useLogin();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface px-md">
			<div className="flex w-full max-w-sm flex-col items-center gap-lg">
				<div className="flex flex-col items-center gap-md">
					<Pill className="size-12 text-brand-500 stroke-[1.5]" />
					<div className="flex flex-col items-center gap-xs text-center">
						<h1 className="font-display text-2xl text-content">PillPilot</h1>
						<p className="text-base text-content-muted">{t("auth.tagline")}</p>
					</div>
				</div>

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
			</div>
		</div>
	);
}
