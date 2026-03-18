"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { isToday, toLongDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

type Props = {
	date: Date;
	onPrev: () => void;
	onNext: () => void;
};

export function DateNavigator({ date, onPrev, onNext }: Props) {
	const t = useTranslations("dashboard");

	return (
		<div className="flex items-center justify-between">
			<Button
				variant="ghost"
				size="icon"
				onClick={onPrev}
				className="text-brand-600"
				aria-label={t("prevDay")}
			>
				<ChevronLeft className="size-5" />
			</Button>
			<h1 className={cn("font-display text-xl text-content", isToday(date) && "text-brand-600")}>
				{toLongDate(date)}
			</h1>
			<Button
				variant="ghost"
				size="icon"
				onClick={onNext}
				className="text-brand-600"
				aria-label={t("nextDay")}
			>
				<ChevronRight className="size-5" />
			</Button>
		</div>
	);
}
