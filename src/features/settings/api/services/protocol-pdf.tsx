import path from "node:path";
import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ProtocolExportModel } from "./protocol-export-model";

Font.register({
	family: "Roboto",
	fonts: [
		{ src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf") },
		{
			src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"),
			fontWeight: 700,
		},
	],
});

const s = StyleSheet.create({
	page: { fontFamily: "Roboto", fontSize: 9, padding: 32 },
	title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
	meta: { fontSize: 9, color: "#555", marginBottom: 2 },
	blockHeader: { fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 4 },
	row: { flexDirection: "row", borderBottom: "1px solid #ddd", paddingVertical: 3 },
	cellName: { width: "32%" },
	cellDose: { width: "16%" },
	cellCycle: { width: "16%" },
	cellDur: { width: "14%" },
	cellNotes: { width: "22%" },
	critical: { color: "#b00020", fontWeight: 700 },
	footer: {
		position: "absolute",
		bottom: 20,
		left: 32,
		right: 32,
		fontSize: 8,
		color: "#888",
	},
});

function cycleText(on: number | null, off: number | null): string {
	if (on == null && off == null) return "—";
	return `${on ?? "?"} / ${off ?? "?"} dni`;
}

export async function buildProtocolPdf(model: ProtocolExportModel): Promise<Buffer> {
	const groups = new Map<string, typeof model.rows>();
	for (const r of model.rows) {
		const key = `${r.timeBlockStartTime} ${r.timeBlockName}`;
		const list = groups.get(key) ?? [];
		list.push(r);
		groups.set(key, list);
	}

	const doc = (
		<Document>
			<Page size="A4" style={s.page}>
				<Text style={s.title}>{model.name}</Text>
				<Text style={s.meta}>Data startu: {model.startDate ?? "—"}</Text>
				<Text style={s.meta}>Wygenerowano: {model.generatedAt}</Text>

				{[...groups.entries()].map(([key, rows]) => (
					<View key={key}>
						<Text style={s.blockHeader}>{key}</Text>
						{rows.map((r) => (
							<View key={`${key}-${r.supplementName}-${r.sortOrder}`} style={s.row}>
								<Text style={[s.cellName, ...(r.isCritical ? [s.critical] : [])]}>
									{r.supplementName}
									{r.brandName ? ` (${r.brandName})` : ""}
								</Text>
								<Text style={s.cellDose}>
									{r.dosageAmount} {r.dosageUnit}
								</Text>
								<Text style={s.cellCycle}>{cycleText(r.cycleDaysOn, r.cycleDaysOff)}</Text>
								<Text style={s.cellDur}>{r.durationDays ? `${r.durationDays} dni` : "—"}</Text>
								<Text style={s.cellNotes}>{r.notes ?? ""}</Text>
							</View>
						))}
					</View>
				))}

				<Text style={s.footer} fixed>
					Wygenerowano w PillPilot — do weryfikacji z zaleceniami lekarza.
				</Text>
			</Page>
		</Document>
	);

	return renderToBuffer(doc);
}
