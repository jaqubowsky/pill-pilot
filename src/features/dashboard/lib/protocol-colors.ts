export const PROTOCOL_BORDER_COLORS = [
	"#7fa06e",
	"#4a7a8a",
	"#c4882b",
	"#8B6BA6",
	"#A67C5B",
] as const;

function hashToIndex(id: string): number {
	let hash = 0;

	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	return (
		((hash % PROTOCOL_BORDER_COLORS.length) + PROTOCOL_BORDER_COLORS.length) %
		PROTOCOL_BORDER_COLORS.length
	);
}

export function assignProtocolColors(protocolIds: string[]): Record<string, number> {
	const unique = [...new Set(protocolIds)];
	const map: Record<string, number> = {};

	for (const id of unique) {
		map[id] = hashToIndex(id);
	}

	return map;
}
