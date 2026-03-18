"use client";

import { useTranslations } from "next-intl";
import { authClient } from "@/shared/lib/auth-client";
import { SignOutButton } from "./sign-out-button";

export function AccountSection() {
	const t = useTranslations();
	const { data: session } = authClient.useSession();

	return (
		<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md">
			<div className="mb-md">
				<p className="text-xs text-content-faint uppercase tracking-wide mb-xs">
					{t("settings.account")}
				</p>
				<p className="text-sm text-content-muted">{session?.user?.email}</p>
			</div>
			<SignOutButton />
		</div>
	);
}
