import Link from "next/link";
import { useTranslations } from "next-intl";
import { PillBottleIcon } from "./pill-bottle-icon";

type Props = {
	hasDraft?: boolean;
	hasProcessing?: boolean;
};

const ACTION_CLASS =
	"inline-flex items-center justify-center rounded-lg bg-brand-500 px-lg py-sm text-sm font-medium text-content-inverse shadow-sm transition-all active:scale-[0.97] active:bg-brand-600";

function StateLayout({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-lg py-2xl text-center">
			<div className="flex size-24 items-center justify-center rounded-2xl bg-brand-100">
				<PillBottleIcon className="size-16" />
			</div>
			<div className="flex flex-col gap-sm">
				<h2 className="font-display text-xl text-content-muted">{title}</h2>
				<p className="text-sm text-content-faint">{description}</p>
			</div>
			{children}
		</div>
	);
}

function ProcessingState() {
	const t = useTranslations("dashboard");
	return (
		<StateLayout title={t("processingTitle")} description={t("processingDescription")}>
			<Link href="/settings" className={ACTION_CLASS}>
				{t("processingBannerLink")}
			</Link>
		</StateLayout>
	);
}

function DraftState() {
	const t = useTranslations("dashboard");
	return (
		<StateLayout title={t("draftTitle")} description={t("draftDescription")}>
			<Link href="/settings" className={ACTION_CLASS}>
				{t("draftAction")}
			</Link>
		</StateLayout>
	);
}

function EmptyState() {
	const t = useTranslations("dashboard");
	return (
		<StateLayout title={t("emptyTitle")} description={t("emptyDescription")}>
			<Link href="/protocol/new" className={ACTION_CLASS}>
				{t("uploadProtocol")}
			</Link>
		</StateLayout>
	);
}

export function DashboardEmptyState({ hasDraft, hasProcessing }: Props) {
	if (hasProcessing) return <ProcessingState />;
	if (hasDraft) return <DraftState />;
	return <EmptyState />;
}
