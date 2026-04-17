"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/shared/components/ui/button";

export default function ShareError() {
	const t = useTranslations();

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-md gap-lg text-center">
			<h1 className="font-display text-2xl text-content">
				{t("settings.share.errorTitle")}
			</h1>
			<p className="text-base text-content-muted">{t("settings.share.errorDescription")}</p>
			<Link href="/dashboard" className={buttonVariants()}>
				{t("common.backToDashboard")}
			</Link>
		</div>
	);
}
