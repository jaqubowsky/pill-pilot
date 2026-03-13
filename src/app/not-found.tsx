import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
	const t = useTranslations();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface px-md">
			<div className="flex w-full max-w-sm flex-col items-center gap-lg text-center">
				<FileQuestion className="size-16 stroke-1 text-brand-300" />
				<div className="flex flex-col gap-xs">
					<h1 className="font-display text-xl text-content-muted">{t("notFound.title")}</h1>
					<p className="text-sm text-content-faint">{t("notFound.description")}</p>
				</div>
				<Link
					href="/dashboard"
					className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-500 px-lg text-sm font-medium text-white shadow-sm active:bg-brand-600 active:scale-[0.97] transition-all duration-150"
				>
					{t("notFound.backHome")}
				</Link>
			</div>
		</div>
	);
}
