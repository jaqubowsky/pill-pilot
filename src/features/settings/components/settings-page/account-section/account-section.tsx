"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { useAccountSection } from "./use-account-section";

type AccountSectionProps = {
	email: string;
};

export function AccountSection({ email }: AccountSectionProps) {
	const t = useTranslations();

	const { handleSignOut } = useAccountSection();

	return (
		<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md">
			<div className="mb-md">
				<p className="text-xs text-content-faint uppercase tracking-wide mb-xs">
					{t("settings.account")}
				</p>
				<p className="text-sm text-content-muted">{email}</p>
			</div>
			<Button variant="destructive" className="w-full" onClick={handleSignOut}>
				{t("common.logout")}
			</Button>
		</div>
	);
}
