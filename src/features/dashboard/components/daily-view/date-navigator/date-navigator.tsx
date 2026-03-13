"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useDateNavigator } from "./use-date-navigator";

type Props = {
	date: Date;
	onPrev: () => void;
	onNext: () => void;
};

export function DateNavigator({ date, onPrev, onNext }: Props) {
	const { isToday, formattedDate } = useDateNavigator(date);

	return (
		<div className="flex items-center justify-between">
			<Button
				variant="ghost"
				size="icon"
				onClick={onPrev}
				className="text-brand-600"
				aria-label="Poprzedni dzień"
			>
				<ChevronLeft className="size-5" />
			</Button>
			<h1 className={cn("font-display text-xl text-content", isToday && "text-brand-600")}>
				{formattedDate}
			</h1>
			<Button
				variant="ghost"
				size="icon"
				onClick={onNext}
				className="text-brand-600"
				aria-label="Następny dzień"
			>
				<ChevronRight className="size-5" />
			</Button>
		</div>
	);
}
