export function detectChangedFields<T extends Record<string, unknown>>(
	oldValues: T,
	newValues: T,
	fields: (keyof T)[],
): (keyof T)[] {
	return fields.filter((field) => oldValues[field] !== newValues[field]);
}

export function buildSyncPayload<T extends Record<string, unknown>>(
	changedFields: string[],
	source: T,
): Partial<T> {
	const result: Partial<T> = {};
	for (const field of changedFields) {
		if (field in source) {
			result[field as keyof T] = source[field as keyof T];
		}
	}
	return result;
}
