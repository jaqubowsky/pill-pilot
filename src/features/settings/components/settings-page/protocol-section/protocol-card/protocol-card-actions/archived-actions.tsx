import { ExportProtocolButton } from "../export-protocol-button";
import { CardActionSection } from "./card-action-section";
import { DeleteButton } from "./delete-button";

type ArchivedActionsProps = {
	protocolId: string;
	onRequestDelete: () => void;
};

export function ArchivedActions({ protocolId, onRequestDelete }: ArchivedActionsProps) {
	return (
		<CardActionSection>
			<ExportProtocolButton protocolId={protocolId} />
			<DeleteButton onClick={onRequestDelete} />
		</CardActionSection>
	);
}
