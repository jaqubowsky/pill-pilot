"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

const VIEWS = [
	{ key: "day", href: "/dashboard" },
	{ key: "week", href: "/dashboard/weekly" },
	{ key: "month", href: "/dashboard/monthly" },
] as const;

export function getActiveKey(pathname: string) {
	if (pathname.startsWith("/dashboard/monthly")) return "month";
	if (pathname.startsWith("/dashboard/weekly")) return "week";
	return "day";
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
