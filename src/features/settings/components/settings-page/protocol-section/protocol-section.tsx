"use client";

import { useTranslations } from "next-intl";
import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import { Button } from "@/shared/components/ui/button";
import { assignProtocolColors, PROTOCOL_BORDER_COLORS } from "@/shared/lib/protocol-colors";
import { ProtocolCard } from "./protocol-card";
import { useProtocolSection } from "./use-protocol-section";

type ProtocolSectionProps = {
	protocols: ProtocolWithSchedules[];
};

export function ProtocolSection({ protocols }: ProtocolSectionProps) {
	const t = useTranslations();

	const hasProcessing = protocols.some((p) => p.status === "processing");
	const { handleAddProtocol } = useProtocolSection(hasProcessing);

	const colorMap = assignProtocolColors(protocols.map((p) => p.id));

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
