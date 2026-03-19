import type {
	ParsedProtocol,
	ParsedSupplement,
} from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { EditedSupplement } from "../components/protocol-base/parsed-preview.schema";
import { resolveScheduleFields } from "./resolve-schedule-fields";

export type IdentifiedSupplement = EditedSupplement & { _id: string; _removed?: boolean };

export function toIdentifiedSupplements(supplements: ParsedSupplement[]): IdentifiedSupplement[] {
	return supplements.map((s) => ({
		...s,
		_id: crypto.randomUUID(),
		schedules: s.schedules.map((sch) => ({
			...sch,
			...resolveScheduleFields(sch, s),
		})),
	}));
}

export function toSerializedProtocol(
	protocolName: string,
	supplements: IdentifiedSupplement[],
	{ includeDraft }: { includeDraft?: boolean } = {},
): string {
	const filtered = includeDraft ? supplements : supplements.filter((s) => !s._removed);

	const parsed: ParsedProtocol = {
		protocolName,
		supplements: filtered.map(({ _id, _removed, ...s }) => ({
			...s,
			schedules: s.schedules.map((sch) => ({
				...sch,
				...resolveScheduleFields(sch, s),
			})),
		})),
	};

	return JSON.stringify(parsed);
}
