"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

const VIEWS = [
	{ key: "day" as const, href: "/dashboard" },
	{ key: "week" as const, href: "/dashboard/weekly" },
	{ key: "month" as const, href: "/dashboard/monthly" },
];

export function ViewSwitcher() {
	const t = useTranslations("dashboard.viewSwitcher");
	const pathname = usePathname();

	const activeKey = pathname.startsWith("/dashboard/monthly")
		? "month"
		: pathname.startsWith("/dashboard/weekly")
			? "week"
			: "day";

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
