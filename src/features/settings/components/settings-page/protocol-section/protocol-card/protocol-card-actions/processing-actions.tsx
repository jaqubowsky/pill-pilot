import { ProcessingPhrase } from "../processing-phrase";
import { CardActionSection } from "./card-action-section";
import { DeleteButton } from "./delete-button";

type ProcessingActionsProps = {
	onRequestDelete: () => void;
};

export function ProcessingActions({ onRequestDelete }: ProcessingActionsProps) {
	return (
		<CardActionSection>
			<ProcessingPhrase />
			<DeleteButton onClick={onRequestDelete} />
		</CardActionSection>
	);
}
