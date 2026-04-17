import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import { ActiveActions } from "./active-actions";
import { ArchivedActions } from "./archived-actions";
import { DraftActions } from "./draft-actions";
import { FailedActions } from "./failed-actions";
import { ProcessingActions } from "./processing-actions";

type ProtocolCardActionsProps = {
	protocolId: string;
	shareToken: string | null;
	status: ProtocolWithSchedules["status"];
	onContinueDraft: () => void;
	onRetry: () => void;
	onRequestArchive: () => void;
	onRequestDelete: () => void;
};

export function ProtocolCardActions({
	protocolId,
	shareToken,
	status,
	onContinueDraft,
	onRetry,
	onRequestArchive,
	onRequestDelete,
}: ProtocolCardActionsProps) {
	switch (status) {
		case "processing":
			return <ProcessingActions onRequestDelete={onRequestDelete} />;
		case "failed":
			return <FailedActions onRetry={onRetry} onRequestDelete={onRequestDelete} />;
		case "draft":
			return <DraftActions onContinueDraft={onContinueDraft} onRequestDelete={onRequestDelete} />;
		case "active":
			return (
				<ActiveActions
					protocolId={protocolId}
					shareToken={shareToken}
					onRequestArchive={onRequestArchive}
				/>
			);
		case "archived":
			return <ArchivedActions onRequestDelete={onRequestDelete} />;
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}
