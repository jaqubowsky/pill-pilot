"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";

export function DeleteButton({ onClick }: { onClick: () => void }) {
	const t = useTranslations();

	return (
		<Button variant="destructive" className="w-full" onClick={onClick}>
			<Trash2 className="size-4" />
			{t("common.delete")}
		</Button>
	);
}
