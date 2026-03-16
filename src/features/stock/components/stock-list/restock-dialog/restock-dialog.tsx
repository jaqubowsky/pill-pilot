"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useRestockDialog } from "./use-restock-dialog";

type RestockDialogProps = {
	supplementId: string;
	supplementName: string;
	stockUnit: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function RestockDialog({
	supplementId,
	supplementName,
	stockUnit,
	open,
	onOpenChange,
}: RestockDialogProps) {
	const t = useTranslations();

	const { amount, setAmount, price, setPrice, inputRef, isPending, handleSubmit } =
		useRestockDialog({ supplementId, open, onOpenChange });

	const unitLabel = t(`schedule.units.${stockUnit}`);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="rounded-2xl p-lg shadow-xl bg-surface-raised"
			>
				<DialogHeader>
					<DialogTitle className="text-base font-semibold text-content">
						{`${t("stock.restockTitle")}: ${supplementName}`}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-md">
					<div className="flex flex-col gap-xs">
						<Label className="text-sm text-content-muted">
							{t("stock.howManyBoughtUnit", { unit: unitLabel })}
						</Label>
						<div className="flex items-center gap-sm">
							<Input
								ref={inputRef}
								type="number"
								min={1}
								step={1}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
								placeholder="90"
							/>
							<span className="text-sm text-content-muted shrink-0">{unitLabel}</span>
						</div>
					</div>

					<div className="flex flex-col gap-xs">
						<Label className="text-sm text-content-muted">{t("stock.restockPrice")}</Label>
						<div className="flex items-center gap-sm">
							<Input
								type="number"
								min={0}
								step={0.01}
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
								placeholder={t("stock.restockPricePlaceholder")}
							/>
							<span className="text-sm text-content-muted shrink-0">zł</span>
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
							disabled={isPending || amount === ""}
							className="bg-brand-500 text-content-inverse"
						>
							{t("common.add")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
