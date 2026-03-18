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

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function UncheckDialog({ open, onOpenChange, onConfirm }: Props) {
	const t = useTranslations("dashboard");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t("uncheckTitle")}</DialogTitle>
					<DialogDescription>{t("uncheckDescription")}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						{t("uncheckCancel")}
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						{t("uncheckConfirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
