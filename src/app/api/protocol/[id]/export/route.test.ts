import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/shared/lib/auth", () => ({ auth: { api: { getSession: () => getSession() } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const getProtocolForExport = vi.fn();
vi.mock("@/features/settings/api/queries/get-protocol-for-export", () => ({
	getProtocolForExport: (...a: unknown[]) => getProtocolForExport(...a),
}));
vi.mock("@/features/settings/api/services/protocol-xlsx", () => ({
	buildProtocolXlsx: async () => Buffer.from("XLSXBYTES"),
}));
vi.mock("@/features/settings/api/services/protocol-pdf", () => ({
	buildProtocolPdf: async () => Buffer.from("%PDF-FAKE"),
}));

import { GET } from "./route";

function ctx(id = "p1") {
	return { params: Promise.resolve({ id }) };
}
function req(format?: string) {
	const u = new URL("http://x/api/protocol/p1/export");
	if (format !== undefined) u.searchParams.set("format", format);
	return new Request(u);
}

describe("GET protocol export", () => {
	beforeEach(() => {
		getSession.mockReset();
		getProtocolForExport.mockReset();
		getSession.mockResolvedValue({ user: { id: "u1" } });
		getProtocolForExport.mockResolvedValue({
			name: "P",
			status: "active",
			startDate: null,
			schedules: [],
		});
	});

	it("401 when no session", async () => {
		getSession.mockResolvedValue(null);
		const res = await GET(req("xlsx"), ctx());
		expect(res.status).toBe(401);
	});

	it("400 on unknown format", async () => {
		const res = await GET(req("docx"), ctx());
		expect(res.status).toBe(400);
	});

	it("400 when protocol status is processing", async () => {
		getProtocolForExport.mockResolvedValue({
			name: "P",
			status: "processing",
			startDate: null,
			schedules: [],
		});
		const res = await GET(req("pdf"), ctx());
		expect(res.status).toBe(400);
	});

	it("404 when query throws not-found", async () => {
		getProtocolForExport.mockRejectedValue(new Error("PROTOCOL_NOT_FOUND"));
		const res = await GET(req("pdf"), ctx());
		expect(res.status).toBe(404);
	});

	it("200 xlsx with attachment headers", async () => {
		const res = await GET(req("xlsx"), ctx());
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("spreadsheetml");
		expect(res.headers.get("content-disposition")).toContain('attachment; filename="p-');
	});

	it("200 pdf with attachment headers", async () => {
		const res = await GET(req("pdf"), ctx());
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("application/pdf");
		expect(res.headers.get("content-disposition")).toContain(".pdf");
	});
});
