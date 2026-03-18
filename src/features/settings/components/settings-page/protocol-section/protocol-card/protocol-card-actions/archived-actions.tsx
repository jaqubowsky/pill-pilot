import { CardActionSection } from "./card-action-section";
import { DeleteButton } from "./delete-button";

type ArchivedActionsProps = {
	onRequestDelete: () => void;
};

export function ArchivedActions({ onRequestDelete }: ArchivedActionsProps) {
	return (
		<CardActionSection>
			<DeleteButton onClick={onRequestDelete} />
		</CardActionSection>
	);
}
