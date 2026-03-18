import { Pill } from "lucide-react";
import { useTranslations } from "next-intl";

export const LoginHeader = () => {
	const t = useTranslations();

	return (
		<div className="flex w-full max-w-sm flex-col items-center gap-lg">
			<div className="flex flex-col items-center gap-md">
				<Pill className="size-12 text-brand-500 stroke-[1.5]" />
				<div className="flex flex-col items-center gap-xs text-center">
					<h1 className="font-display text-2xl text-content">PillPilot</h1>
					<p className="text-base text-content-muted">{t("auth.tagline")}</p>
				</div>
			</div>
		</div>
	);
};
