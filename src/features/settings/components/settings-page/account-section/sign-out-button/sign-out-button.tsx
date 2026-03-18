"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { useSignOutButton } from "./use-sign-out-button";

export function SignOutButton() {
	const t = useTranslations();
	const { handleSignOut } = useSignOutButton();

	return (
		<Button variant="destructive" className="w-full" onClick={handleSignOut}>
			{t("common.logout")}
		</Button>
	);
}
