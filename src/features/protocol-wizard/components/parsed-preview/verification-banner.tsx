"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

type VerificationBannerProps = {
	unverifiedCount: number;
	firstUnverifiedId: string | null;
};

function scrollToSupplement(id: string) {
	document
		.querySelector(`[data-supplement-id="${id}"]`)
		?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function VerificationBanner({
	unverifiedCount,
	firstUnverifiedId,
}: VerificationBannerProps) {
	const t = useTranslations();

	const handleClick = useCallback(() => {
		if (firstUnverifiedId) scrollToSupplement(firstUnverifiedId);
	}, [firstUnverifiedId]);

	if (unverifiedCount === 0) return null;

	return (
		<button
			type="button"
			onClick={handleClick}
			className="w-full rounded-xl bg-warning-bg border border-warning/20 p-md text-left active:scale-[0.99] transition-transform"
		>
			<p className="text-sm text-warning-text">
				{unverifiedCount === 1
					? t("protocolWizard.requiresVerification", { count: unverifiedCount })
					: t("protocolWizard.requiresVerificationMany", { count: unverifiedCount })}
				<span className="ml-xs">&darr;</span>
			</p>
		</button>
	);
}
