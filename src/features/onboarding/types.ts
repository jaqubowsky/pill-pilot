type TimeBlockSummary = {
	id: string;
	name: string;
	startTime: string;
};

type ExistingSupplementSummary = {
	id: string;
	name: string;
	brandName: string | null;
};

export type { ExistingSupplementSummary, TimeBlockSummary };
