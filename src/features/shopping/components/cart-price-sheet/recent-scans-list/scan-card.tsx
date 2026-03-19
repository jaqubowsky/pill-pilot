import { AlertTriangle, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

type ScanSummary = {
	id: string;
	status: "processing" | "completed" | "failed";
	shopName: string | null;
	items: { productName: string; price: number }[];
	createdAt: Date;
};

type Props = {
	scan: ScanSummary;
	onLoad: () => void;
	onDelete: () => void;
};

function ScanTimestamp({ date }: { date: Date }) {
	return (
		<span className="text-xs text-content-faint">
			{date.toLocaleString("pl-PL", {
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
			})}
		</span>
	);
}

const cardBase = "flex flex-col gap-xs rounded-xl p-sm pr-lg min-w-[140px] max-w-[160px]";

export function ScanCard({ scan, onLoad, onDelete }: Props) {
	const t = useTranslations("shopping.cartPriceSheet");

	return (
		<div className="relative shrink-0">
			<button
				type="button"
				onClick={onDelete}
				className="absolute top-xs right-xs text-content-faint hover:text-content-muted z-10 after:absolute after:inset-1/2 after:min-h-11 after:min-w-11 after:-translate-1/2"
			>
				<X className="size-3.5" />
			</button>

			{scan.status === "processing" && (
				<div className={`${cardBase} border border-brand-200 bg-brand-50/50`}>
					<div className="flex items-center gap-xs">
						<Loader2 className="size-3.5 animate-spin text-brand-600" />
						<span className="text-sm font-medium text-brand-600">{t("analysing")}</span>
					</div>
					<ScanTimestamp date={scan.createdAt} />
				</div>
			)}

			{scan.status === "failed" && (
				<div className={`${cardBase} border border-danger/20 bg-danger-bg`}>
					<div className="flex items-center gap-xs">
						<AlertTriangle className="size-3.5 text-danger" />
						<span className="text-sm font-medium text-danger">{t("scanFailed")}</span>
					</div>
					<ScanTimestamp date={scan.createdAt} />
				</div>
			)}

			{scan.status === "completed" && (
				<button
					type="button"
					onClick={onLoad}
					className={`${cardBase} border border-edge-subtle bg-surface-raised text-left active:scale-[0.98] transition-transform shadow-sm`}
				>
					<span className="text-sm font-medium text-content truncate w-full">
						{scan.shopName ?? t("selectShop")}
					</span>
					<span className="text-xs text-content-faint">
						{t("items", { count: scan.items.length })}
					</span>
					<ScanTimestamp date={scan.createdAt} />
				</button>
			)}
		</div>
	);
}
