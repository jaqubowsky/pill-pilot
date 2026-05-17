import ExcelJS from "exceljs";
import type { ProtocolExportModel } from "./protocol-export-model";

const COLUMNS = [
	"Blok",
	"Godzina",
	"Suplement",
	"Marka",
	"Kategoria",
	"Dawka",
	"Jednostka",
	"Krytyczny",
	"Cykl on (dni)",
	"Cykl off (dni)",
	"Offset startu (dni)",
	"Czas trwania (dni)",
	"Notatki",
];

export async function buildProtocolXlsx(model: ProtocolExportModel): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet("Protokół");

	ws.addRow([`Protokół: ${model.name}`]);
	ws.addRow([`Data startu: ${model.startDate ?? "—"}`]);
	ws.addRow([`Wygenerowano: ${model.generatedAt}`]);
	ws.addRow([]);

	const headerRow = ws.addRow(COLUMNS);
	headerRow.font = { bold: true };

	for (const r of model.rows) {
		ws.addRow([
			r.timeBlockName,
			r.timeBlockStartTime,
			r.supplementName,
			r.brandName ?? "",
			r.category,
			r.dosageAmount,
			r.dosageUnit,
			r.isCritical ? "Tak" : "Nie",
			r.cycleDaysOn ?? "",
			r.cycleDaysOff ?? "",
			r.startDayOffset,
			r.durationDays ?? "",
			r.notes ?? "",
		]);
	}

	const out = await wb.xlsx.writeBuffer();
	return out as unknown as Buffer;
}
