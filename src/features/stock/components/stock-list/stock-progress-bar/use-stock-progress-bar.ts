type UseStockProgressBarParams = {
	currentStock: number;
	daysInStock: number;
	dailyUsage: number;
	packageSize: number | null;
};

export function useStockProgressBar({
	currentStock,
	daysInStock,
	dailyUsage,
	packageSize,
}: UseStockProgressBarParams) {
	const hasUsage = dailyUsage > 0;
	const maxStock = packageSize ?? (hasUsage ? dailyUsage * 30 : currentStock);
	const percent = maxStock > 0 ? Math.min(100, Math.round((currentStock / maxStock) * 100)) : 0;

	return { hasUsage, percent };
}
