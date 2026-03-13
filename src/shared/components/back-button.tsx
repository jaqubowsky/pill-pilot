"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";

export function BackButton() {
	const router = useRouter();
	const t = useTranslations();

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={() => router.back()}
			className="self-start -ml-sm text-content-muted"
		>
			<ChevronLeft className="size-4" />
			{t("common.back")}
		</Button>
	);
}
