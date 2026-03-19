"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { replenishStock } from "@/features/stock/api/actions/replenish-stock";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const restockSchema = z.object({
	amount: z.number().positive(),
	packagePrice: z.number().positive().optional(),
});

type RestockValues = z.infer<typeof restockSchema>;

type Props = {
	supplementId: string;
	stockUnit: string;
	onClose: () => void;
};

export function RestockForm({ supplementId, stockUnit, onClose }: Props) {
	const t = useTranslations();
	const unitLabel = t(`schedule.units.${stockUnit}`);

	const {
		register,
		handleSubmit,
		reset,
		formState: { isValid },
	} = useForm<RestockValues>({
		resolver: zodResolver(restockSchema),
		mode: "onChange",
	});

	const { execute, isPending } = useAction(replenishStock, {
		onSuccess: () => {
			reset();
			onClose();
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	function onSubmit(values: RestockValues) {
		execute({
			supplementId,
			amount: values.amount,
			packagePrice: values.packagePrice,
		});
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-md">
			<div className="flex flex-col gap-xs">
				<Label className="text-sm text-content-muted">
					{t("stock.howManyBoughtUnit", { unit: unitLabel })}
				</Label>
				<div className="flex items-center gap-sm">
					<Input
						{...register("amount", { valueAsNumber: true })}
						type="number"
						min={1}
						step={1}
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
						{...register("packagePrice", { valueAsNumber: true })}
						type="number"
						min={0}
						step={0.01}
						className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
						placeholder={t("stock.restockPricePlaceholder")}
					/>
					<span className="text-sm text-content-muted shrink-0">{t("common.currency")}</span>
				</div>
			</div>

			<div className="flex gap-sm justify-end">
				<Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
					{t("common.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={isPending || !isValid}
					className="bg-brand-500 text-content-inverse"
				>
					{t("common.add")}
				</Button>
			</div>
		</form>
	);
}
