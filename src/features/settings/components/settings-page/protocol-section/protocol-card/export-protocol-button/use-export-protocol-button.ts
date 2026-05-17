"use client";

export function useExportProtocolButton(protocolId: string) {
	const base = `/api/protocol/${protocolId}/export`;
	return {
		pdfHref: `${base}?format=pdf`,
		excelHref: `${base}?format=xlsx`,
	};
}
