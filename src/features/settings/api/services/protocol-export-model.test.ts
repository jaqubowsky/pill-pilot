import { describe, expect, it } from "vitest";
import { toExportFilename } from "./protocol-export-model";

describe("toExportFilename", () => {
	it("slugifies name, strips Polish diacritics, appends date and extension", () => {
		expect(toExportFilename("Protokół Jelitowy", "pdf", "2026-05-17")).toBe(
			"protokol-jelitowy-2026-05-17.pdf",
		);
	});

	it("collapses non-alphanumerics and trims dashes", () => {
		expect(toExportFilename("  Mój / Plan #1  ", "xlsx", "2026-01-02")).toBe(
			"moj-plan-1-2026-01-02.xlsx",
		);
	});

	it("falls back to 'protokol' when name has no usable characters", () => {
		expect(toExportFilename("———", "pdf", "2026-05-17")).toBe("protokol-2026-05-17.pdf");
	});
});
