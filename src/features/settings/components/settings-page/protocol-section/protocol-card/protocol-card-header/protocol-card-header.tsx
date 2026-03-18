import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import { ActiveBadge } from "./active-badge";
import { ArchivedBadge } from "./archived-badge";
import { DraftBadge } from "./draft-badge";
import { FailedBadge } from "./failed-badge";
import { ProcessingBadge } from "./processing-badge";

type StatusBadgeProps = {
	status: ProtocolWithSchedules["status"];
	onEdit: () => void;
	onReactivate: () => void;
	isReactivating: boolean;
};

function StatusBadge({ status, onEdit, onReactivate, isReactivating }: StatusBadgeProps) {
	switch (status) {
		case "processing":
			return <ProcessingBadge />;
		case "failed":
			return <FailedBadge />;
		case "draft":
			return <DraftBadge />;
		case "archived":
			return (
				<ArchivedBadge
					onEdit={onEdit}
					onReactivate={onReactivate}
					isReactivating={isReactivating}
				/>
			);
		case "active":
			return <ActiveBadge onEdit={onEdit} />;
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

type ProtocolCardHeaderProps = {
	protocol: ProtocolWithSchedules;
	onEdit: () => void;
	onReactivate: () => void;
	isReactivating: boolean;
};

export function ProtocolCardHeader({
	protocol,
	onEdit,
	onReactivate,
	isReactivating,
}: ProtocolCardHeaderProps) {
	return (
		<div className="flex items-center justify-between px-md py-sm">
			<span className="text-sm font-bold text-content truncate min-w-0">{protocol.name}</span>
			<div className="flex items-center gap-sm shrink-0">
				<StatusBadge
					status={protocol.status}
					onEdit={onEdit}
					onReactivate={onReactivate}
					isReactivating={isReactivating}
				/>
			</div>
		</div>
	);
}
