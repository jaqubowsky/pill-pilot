"use client";

import { CalendarCheck, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

const navItems = [
	{ href: "/dashboard", icon: CalendarCheck, labelKey: "nav.today" },
	{ href: "/stock", icon: Package, labelKey: "nav.stock" },
	{ href: "/settings", icon: Settings, labelKey: "nav.settings" },
] as const;

export function BottomNav() {
	const pathname = usePathname();
	const t = useTranslations();

	return (
		<nav className="fixed bottom-0 inset-x-0 bg-surface-raised/90 backdrop-blur-md border-t border-edge-subtle h-16 pb-[env(safe-area-inset-bottom)] z-50" style={{ viewTransitionName: "bottom-nav" }}>
			<div className="mx-auto max-w-md flex h-full">
				{navItems.map(({ href, icon: Icon, labelKey }) => {
					const isActive = pathname === href || pathname.startsWith(`${href}/`);
					return (
						<Link
							key={href}
							href={href}
							className="flex-1 flex flex-col items-center justify-center gap-xs transition-colors duration-150"
						>
							<Icon
								className={cn(
									"size-6 stroke-[1.5]",
									isActive ? "text-brand-600" : "text-content-faint",
								)}
							/>
							<span
								className={cn(
									"text-xs font-semibold",
									isActive ? "text-brand-600" : "text-content-faint",
								)}
							>
								{t(labelKey)}
							</span>
							{isActive && <span className="size-1 rounded-full bg-brand-500" aria-hidden="true" />}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
