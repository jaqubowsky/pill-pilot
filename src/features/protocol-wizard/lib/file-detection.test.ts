import { describe, expect, it } from "vitest";
import { isDocx, isExcel, isImage, isPdf, isSupportedFile, isText } from "./file-detection";

function makeFile(name: string, type: string): File {
	return new File([""], name, { type });
}

describe("isPdf", () => {
	it("detects by MIME type", () => {
		expect(isPdf(makeFile("doc.pdf", "application/pdf"))).toBe(true);
	});

	it("detects by extension", () => {
		expect(isPdf(makeFile("doc.pdf", ""))).toBe(true);
	});

	it("rejects non-PDF", () => {
		expect(isPdf(makeFile("doc.txt", "text/plain"))).toBe(false);
	});
});

describe("isExcel", () => {
	it("detects xlsx by extension", () => {
		expect(isExcel(makeFile("data.xlsx", ""))).toBe(true);
	});

	it("detects xls by extension", () => {
		expect(isExcel(makeFile("data.xls", ""))).toBe(true);
	});

	it("detects by MIME type with spreadsheet", () => {
		expect(
			isExcel(
				makeFile("data", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
			),
		).toBe(true);
	});

	it("detects by MIME type with excel", () => {
		expect(isExcel(makeFile("data", "application/vnd.ms-excel"))).toBe(true);
	});

	it("rejects non-Excel", () => {
		expect(isExcel(makeFile("data.csv", "text/csv"))).toBe(false);
	});
});

describe("isImage", () => {
	it("detects JPEG", () => {
		expect(isImage(makeFile("photo.jpg", "image/jpeg"))).toBe(true);
	});

	it("detects PNG", () => {
		expect(isImage(makeFile("photo.png", "image/png"))).toBe(true);
	});

	it("detects WebP", () => {
		expect(isImage(makeFile("photo.webp", "image/webp"))).toBe(true);
	});

	it("detects GIF", () => {
		expect(isImage(makeFile("anim.gif", "image/gif"))).toBe(true);
	});

	it("rejects SVG", () => {
		expect(isImage(makeFile("icon.svg", "image/svg+xml"))).toBe(false);
	});

	it("rejects non-image", () => {
		expect(isImage(makeFile("doc.pdf", "application/pdf"))).toBe(false);
	});
});

describe("isDocx", () => {
	it("detects by MIME type", () => {
		expect(
			isDocx(
				makeFile(
					"doc.docx",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				),
			),
		).toBe(true);
	});

	it("detects by extension", () => {
		expect(isDocx(makeFile("doc.docx", ""))).toBe(true);
	});

	it("rejects .doc (old format)", () => {
		expect(isDocx(makeFile("doc.doc", "application/msword"))).toBe(false);
	});
});

describe("isText", () => {
	it("detects by MIME type", () => {
		expect(isText(makeFile("notes.txt", "text/plain"))).toBe(true);
	});

	it("detects by extension", () => {
		expect(isText(makeFile("notes.txt", ""))).toBe(true);
	});

	it("rejects HTML", () => {
		expect(isText(makeFile("page.html", "text/html"))).toBe(false);
	});
});

describe("isSupportedFile", () => {
	it("accepts all supported types", () => {
		expect(isSupportedFile(makeFile("doc.pdf", "application/pdf"))).toBe(true);
		expect(isSupportedFile(makeFile("data.xlsx", ""))).toBe(true);
		expect(isSupportedFile(makeFile("doc.docx", ""))).toBe(true);
		expect(isSupportedFile(makeFile("photo.jpg", "image/jpeg"))).toBe(true);
		expect(isSupportedFile(makeFile("notes.txt", "text/plain"))).toBe(true);
	});

	it("rejects unsupported types", () => {
		expect(isSupportedFile(makeFile("video.mp4", "video/mp4"))).toBe(false);
		expect(isSupportedFile(makeFile("archive.zip", "application/zip"))).toBe(false);
	});
});
