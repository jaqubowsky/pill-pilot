"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import {
	assignProtocolColors,
	PROTOCOL_BORDER_COLORS,
} from "@/features/dashboard/lib/protocol-colors";
import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import { Button } from "@/shared/components/ui/button";
import { ProtocolCard } from "./protocol-card";
import { useProtocolSection } from "./use-protocol-section";

type ProtocolSectionProps = {
	protocols: ProtocolWithSchedules[];
};

export function ProtocolSection({ protocols }: ProtocolSectionProps) {
	const t = useTranslations();
	const router = useRouter();
	const { handleAddProtocol } = useProtocolSection();
	const colorMap = assignProtocolColors(protocols.map((p) => p.id));

	const hasProcessing = protocols.some((p) => p.status === "processing");

	useEffect(() => {
		if (!hasProcessing) return;

		const interval = setInterval(() => {
			router.refresh();
		}, 5000);

		return () => clearInterval(interval);
	}, [hasProcessing, router]);

	return (
		<div className="flex flex-col gap-md">
			{protocols.map((protocol) => (
				<ProtocolCard
					key={protocol.id}
					protocol={protocol}
					borderColor={PROTOCOL_BORDER_COLORS[colorMap[protocol.id] ?? 0]}
				/>
			))}

			<Button className="w-full" onClick={handleAddProtocol}>
				{t("common.addProtocol")}
			</Button>
		</div>
	);
}
