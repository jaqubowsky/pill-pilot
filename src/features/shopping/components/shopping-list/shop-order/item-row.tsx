"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toShortDate } from "@/shared/lib/date";
import { formatAmount } from "@/shared/lib/format-currency";
import type { OptimizedItem } from "../../../lib/optimize-shopping";

type ItemRowProps = {
	item: OptimizedItem;
	muted: boolean;
};

export function ItemRow({ item, muted }: ItemRowProps) {
	const t = useTranslations("shopping");
	const tCommon = useTranslations("common");
	const isUrgent = item.daysRemaining <= 3;

	return (
		<div
			className={`flex items-center gap-sm py-sm border-b border-dashed border-edge-subtle last:border-b-0 ${muted ? "opacity-60" : ""}`}
		>
			{isUrgent && !muted && (
				<div className="flex items-center justify-center size-7 rounded-md shrink-0 bg-danger-bg">
					<AlertTriangle size={14} strokeWidth={1.5} className="text-danger" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<p className={`text-sm truncate ${muted ? "text-content-muted" : "text-content"}`}>
					{item.name}
				</p>
				<p className="text-xs text-content-faint">
					{t("list.depletionDate", { date: toShortDate(new Date(item.depletionDate)) })}
				</p>
			</div>
			<div className="flex flex-col items-end shrink-0 gap-xs">
				{item.packagePrice !== null && (
					<span
						className={`text-sm tabular-nums ${muted ? "text-content-muted" : "font-semibold text-content"}`}
					>
						{formatAmount(parseFloat(item.packagePrice))} {tCommon("currency")}
					</span>
				)}
				{isUrgent && !muted && (
					<span className="text-xs font-semibold uppercase tracking-wide text-danger bg-danger-bg rounded-md px-xs py-0.5">
						{t("list.urgent")}
					</span>
				)}
			</div>
		</div>
	);
}
