"use client";

import { useTranslations } from "next-intl";
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
	const { handleAddProtocol } = useProtocolSection();
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
