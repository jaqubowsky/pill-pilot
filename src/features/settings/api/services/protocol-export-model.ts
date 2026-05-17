import type { DosageUnit, ProtocolStatus, SupplementCategory } from "@/shared/db/schema";

export type ProtocolForExportData = {
	name: string;
	status: ProtocolStatus;
	startDate: string | null;
	schedules: {
		dosageAmount: string;
		dosageUnit: DosageUnit;
		notes: string | null;
		isCritical: boolean;
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		startDayOffset: number;
		durationDays: number | null;
		sortOrder: number;
		active: boolean;
		supplement: { name: string; brandName: string | null; category: SupplementCategory };
		timeBlock: { name: string; startTime: string };
	}[];
};

export type ProtocolExportRow = {
	timeBlockName: string;
	timeBlockStartTime: string;
	supplementName: string;
	brandName: string | null;
	category: SupplementCategory;
	dosageAmount: string;
	dosageUnit: DosageUnit;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	sortOrder: number;
	notes: string | null;
};

export type ProtocolExportModel = {
	name: string;
	startDate: string | null;
	generatedAt: string;
	rows: ProtocolExportRow[];
};

export function mapToExportRows(
	data: ProtocolForExportData,
	generatedAt: string,
): ProtocolExportModel {
	const rows: ProtocolExportRow[] = data.schedules
		.filter((s) => s.active)
		.map((s) => ({
			timeBlockName: s.timeBlock.name,
			timeBlockStartTime: s.timeBlock.startTime,
			supplementName: s.supplement.name,
			brandName: s.supplement.brandName,
			category: s.supplement.category,
			dosageAmount: s.dosageAmount,
			dosageUnit: s.dosageUnit,
			isCritical: s.isCritical,
			cycleDaysOn: s.cycleDaysOn,
			cycleDaysOff: s.cycleDaysOff,
			startDayOffset: s.startDayOffset,
			durationDays: s.durationDays,
			sortOrder: s.sortOrder,
			notes: s.notes,
		}))
		.sort((a, b) => {
			if (a.timeBlockStartTime !== b.timeBlockStartTime) {
				return a.timeBlockStartTime < b.timeBlockStartTime ? -1 : 1;
			}
			return a.sortOrder - b.sortOrder;
		});

	return { name: data.name, startDate: data.startDate, generatedAt, rows };
}

export function toExportFilename(name: string, ext: "pdf" | "xlsx", dateString: string): string {
	const slug = name
		.replace(/[łŁ]/g, "l")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const base = slug.length > 0 ? slug : "protokol";
	return `${base}-${dateString}.${ext}`;
}
