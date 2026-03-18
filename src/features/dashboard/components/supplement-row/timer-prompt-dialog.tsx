import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatMinutes } from "@/shared/lib/format-minutes";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (skipTimer: boolean) => void;
	timerMinutes: number;
};

export function TimerPromptDialog({ open, onOpenChange, onConfirm, timerMinutes }: Props) {
	const t = useTranslations("dashboard");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t("timerPromptTitle")}</DialogTitle>
					<DialogDescription>
						{t("timerPromptDescription", { time: formatMinutes(timerMinutes) })}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onConfirm(true)}>
						{t("timerPromptSkip")}
					</Button>
					<Button onClick={() => onConfirm(false)}>{t("timerPromptStart")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
