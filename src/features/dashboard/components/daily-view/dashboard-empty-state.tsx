import Link from "next/link";
import { useTranslations } from "next-intl";
import { PillBottleIcon } from "./pill-bottle-icon";

export function DashboardEmptyState() {
	const t = useTranslations("dashboard");
	return (
		<div className="flex flex-col items-center justify-center gap-lg py-2xl text-center">
			<div className="flex size-24 items-center justify-center rounded-2xl bg-brand-100">
				<PillBottleIcon className="size-16" />
			</div>
			<div className="flex flex-col gap-sm">
				<h2 className="font-display text-xl text-content-muted">{t("emptyTitle")}</h2>
				<p className="text-sm text-content-faint">{t("emptyDescription")}</p>
			</div>
			<Link
				href="/protocol/new"
				className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-lg py-sm text-sm font-medium text-content-inverse shadow-sm transition-all active:scale-[0.97] active:bg-brand-600"
			>
				{t("uploadProtocol")}
			</Link>
		</div>
	);
}
