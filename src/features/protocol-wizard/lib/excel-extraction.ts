import type ExcelJS from "exceljs";

function getCellColor(cell: ExcelJS.Cell): string | null {
	const fill = cell.fill;
	if (!fill || fill.type !== "pattern" || !fill.fgColor) return null;
	const color = fill.fgColor;
	if (color.argb) {
		const hex = color.argb.slice(2).toLowerCase();
		if (hex === "ffffff" || hex === "000000") return null;
		return `#${hex}`;
	}
	return null;
}

export async function extractTextFromExcel(buffer: Buffer): Promise<string> {
	const ExcelJS = await import("exceljs");
	const workbook = new ExcelJS.default.Workbook();
	await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
	const lines: string[] = [];

	for (const worksheet of workbook.worksheets) {
		lines.push(`Sheet: ${worksheet.name}`);

		const legendColors = new Map<string, string>();
		const legendRow = worksheet.getRow(2);
		if (legendRow) {
			legendRow.eachCell((cell, _colNumber) => {
				const color = getCellColor(cell);
				const text = String(cell.value ?? "").trim();
				if (color && text) {
					legendColors.set(color, text);
				}
			});
		}

		if (legendColors.size > 0) {
			lines.push(
				`COLOR LEGEND: ${Array.from(legendColors.entries())
					.map(([c, t]) => `${c}=${t}`)
					.join(", ")}`,
			);
		}

		worksheet.eachRow((row, _rowNumber) => {
			const values = row.values as (string | number | null | undefined)[];
			const text = values.slice(1).join(",");

			const firstCell = row.getCell(1);
			const color = getCellColor(firstCell);
			const phase = color ? legendColors.get(color) : null;

			if (phase) {
				lines.push(`[PHASE: ${phase}] ${text}`);
			} else {
				lines.push(text);
			}
		});
	}

	return lines.join("\n");
}
