import { useTranslations } from "next-intl";
import { formatQuantity } from "@/shared/lib/format-currency";

type StockQuantityProps = {
	currentStock: string;
	packageSize: number | null;
	stockUnit: string;
};

export function StockQuantity({ currentStock, packageSize, stockUnit }: StockQuantityProps) {
	const t = useTranslations();
	const unit = t(`schedule.units.${stockUnit}`);

	if (packageSize) {
		return (
			<p className="text-sm text-content-faint">
				{formatQuantity(currentStock)}/{packageSize} {unit}
			</p>
		);
	}

	return (
		<p className="text-sm text-content-faint">
			{formatQuantity(currentStock)} {unit}
		</p>
	);
}
