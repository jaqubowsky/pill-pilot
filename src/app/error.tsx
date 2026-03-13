"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

type ErrorPageProps = {
	reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
	const t = useTranslations();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface px-md">
			<div className="flex w-full max-w-sm flex-col items-center gap-lg text-center">
				<AlertTriangle className="size-16 stroke-1 text-danger" />
				<div className="flex flex-col gap-xs">
					<h1 className="font-display text-xl text-content-muted">{t("error.title")}</h1>
					<p className="text-sm text-content-faint">{t("error.description")}</p>
				</div>
				<button
					onClick={reset}
					className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-500 px-lg text-sm font-medium text-white shadow-sm active:bg-brand-600 active:scale-[0.97] transition-all duration-150"
				>
					{t("error.retry")}
				</button>
			</div>
		</div>
	);
}
