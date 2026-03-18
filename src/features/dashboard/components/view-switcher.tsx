"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

const DAY_VIEW = { key: "day" as const, href: "/dashboard" };
const WEEK_VIEW = { key: "week" as const, href: "/dashboard/weekly" };
const MONTH_VIEW = { key: "month" as const, href: "/dashboard/monthly" };

const VIEWS = [DAY_VIEW, WEEK_VIEW, MONTH_VIEW];

function getActiveKey(pathname: string) {
	const activeView = VIEWS.find((view) => pathname.startsWith(view.href));
	return activeView?.key ?? "day";
}

export function ViewSwitcher() {
	const t = useTranslations("dashboard.viewSwitcher");

	const pathname = usePathname();
	const activeKey = getActiveKey(pathname);

	return (
		<div className="flex rounded-lg bg-surface-sunken p-xs">
			{VIEWS.map(({ key, href }) => (
				<Link
					key={key}
					href={href}
					className={cn(
						"flex-1 rounded-md min-h-11 flex items-center justify-center text-center text-sm font-medium transition-colors duration-150",
						activeKey === key ? "bg-surface-raised text-content shadow-sm" : "text-content-muted",
					)}
				>
					{t(key)}
				</Link>
			))}
		</div>
	);
}
