import { headers } from "next/headers";
import { getProtocolForExport } from "@/features/settings/api/queries/get-protocol-for-export";
import {
	mapToExportRows,
	toExportFilename,
} from "@/features/settings/api/services/protocol-export-model";
import { buildProtocolPdf } from "@/features/settings/api/services/protocol-pdf";
import { buildProtocolXlsx } from "@/features/settings/api/services/protocol-xlsx";
import { auth } from "@/shared/lib/auth";
import { toDateString } from "@/shared/lib/date";

export const runtime = "nodejs";

const EXPORTABLE = new Set(["draft", "active", "archived"]);
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const format = new URL(request.url).searchParams.get("format");
	if (format !== "pdf" && format !== "xlsx") {
		return Response.json({ error: "invalid_format" }, { status: 400 });
	}

	const { id } = await params;

	let data: Awaited<ReturnType<typeof getProtocolForExport>>;
	try {
		data = await getProtocolForExport(id, session.user.id);
	} catch {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	if (!EXPORTABLE.has(data.status)) {
		return Response.json({ error: "not_exportable" }, { status: 400 });
	}

	const generatedAt = toDateString(new Date());
	const model = mapToExportRows(data, generatedAt);
	const filename = toExportFilename(model.name, format, generatedAt);

	const body = format === "pdf" ? await buildProtocolPdf(model) : await buildProtocolXlsx(model);
	const contentType = format === "pdf" ? "application/pdf" : XLSX_MIME;

	return new Response(new Uint8Array(body), {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-store",
		},
	});
}
