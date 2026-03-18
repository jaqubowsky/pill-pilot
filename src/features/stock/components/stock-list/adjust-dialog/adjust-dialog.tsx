"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { useAdjustDialog } from "./use-adjust-dialog";

type AdjustDialogProps = {
	supplementId: string;
	supplementName: string;
	currentStock: string | null;
	stockUnit: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AdjustDialog({
	supplementId,
	supplementName,
	currentStock,
	stockUnit,
	open,
	onOpenChange,
}: AdjustDialogProps) {
	const t = useTranslations();

	const { value, setValue, isPending, handleSubmit } = useAdjustDialog({
		supplementId,
		currentStock,
		open,
		onOpenChange,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="rounded-2xl p-lg shadow-xl bg-surface-raised"
			>
				<DialogHeader>
					<DialogTitle className="text-base font-semibold text-content">
						{t("stock.adjustTitle")}: {supplementName}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-md">
					<div className="flex flex-col gap-xs">
						<p className="text-sm text-content-muted">{t("stock.howManyLeft")}</p>
						<div className="flex items-center gap-sm">
							<Input
								type="number"
								min={0}
								step={1}
								value={value}
								onChange={(e) => setValue(e.target.value)}
								className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
								placeholder="0"
							/>
							<span className="text-sm text-content-muted shrink-0">
								{t(`schedule.units.${stockUnit}`)}
							</span>
						</div>
					</div>
					<div className="flex gap-sm justify-end">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							variant="default"
							disabled={isPending || value === ""}
							className="bg-brand-500 text-content-inverse"
						>
							{t("common.save")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
