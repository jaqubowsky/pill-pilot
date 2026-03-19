"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RecentScan } from "@/features/shopping/api/queries/get-recent-scans";
import { DeleteScanDialog } from "./delete-scan-dialog";
import { ScanCard } from "./scan-card";

type Props = {
	recentScans: RecentScan[];
	loadScan: (data: { scanId: string; shopName: string | null; items: RecentScan["items"] }) => void;
};

export function RecentScansList({ recentScans, loadScan }: Props) {
	const t = useTranslations("shopping.cartPriceSheet");
	const [deleteScanId, setDeleteScanId] = useState<string | null>(null);

	if (recentScans.length === 0) return null;

	return (
		<>
			<div className="flex flex-col gap-sm">
				<div className="flex items-center gap-xs">
					<Clock size={14} className="text-content-faint stroke-[1.5]" />
					<span className="text-xs font-semibold uppercase tracking-wide text-content-faint">
						{t("recentScans")}
					</span>
				</div>
				<div className="flex gap-sm overflow-x-auto pb-xs -mx-md px-md scrollbar-none">
					{recentScans.map((scan) => (
						<ScanCard
							key={scan.id}
							scan={scan}
							onLoad={() =>
								loadScan({ scanId: scan.id, shopName: scan.shopName, items: scan.items })
							}
							onDelete={() => setDeleteScanId(scan.id)}
						/>
					))}
				</div>
			</div>

			<DeleteScanDialog scanId={deleteScanId} onClose={() => setDeleteScanId(null)} />
		</>
	);
}
