export const PROTOCOL_BORDER_COLORS = [
	"#7fa06e",
	"#4a7a8a",
	"#c4882b",
	"#8B6BA6",
	"#A67C5B",
] as const;

export function assignProtocolColors(protocolIds: string[]): Record<string, number> {
	const sorted = [...new Set(protocolIds)].sort();
	const map: Record<string, number> = {};
	for (let i = 0; i < sorted.length; i++) {
		map[sorted[i]] = i % PROTOCOL_BORDER_COLORS.length;
	}
	return map;
}
