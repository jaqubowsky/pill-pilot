import { useTranslations } from "next-intl";
import type { SupplementCategory } from "@/shared/db/schema";
import { DetailRow, type DetailRowDef } from "./detail-row";

type Props = {
	brandName?: string | null;
	category: SupplementCategory;
	dosageAmount: number;
	dosageUnit: string;
	timeBlockName: string;
	notes?: string | null;
	packageSize?: number | null;
};

export function ScheduleMainDetails({
	brandName,
	category,
	dosageAmount,
	dosageUnit,
	timeBlockName,
	notes,
	packageSize,
}: Props) {
	const t = useTranslations();
	const unitLabel = t(`schedule.units.${dosageUnit}`);

	const rows: DetailRowDef[] = [
		brandName ? { key: "brand", label: t("supplement.brand"), value: brandName } : null,
		{
			key: "category",
			label: t("supplement.category"),
			value: t(`supplement.categories.${category}`),
		},
		{ key: "dosage", label: t("schedule.dosage"), value: `${dosageAmount} ${unitLabel}` },
		{ key: "block", label: t("schedule.block"), value: timeBlockName },
		packageSize != null && packageSize > 0
			? {
					key: "packageSize",
					label: t("supplement.packageSize"),
					value: `${packageSize} ${unitLabel}`,
				}
			: null,
		notes ? { key: "notes", label: t("schedule.notes"), value: notes } : null,
	].filter((row): row is DetailRowDef => row !== null);

	return (
		<div className="flex flex-col">
			{rows.map((row) => (
				<DetailRow key={row.key} label={row.label} value={row.value} />
			))}
		</div>
	);
}
