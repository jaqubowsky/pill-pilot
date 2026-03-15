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

type ActiveProtocolSummary = {
	name: string;
	supplements: string[];
};

export type { ActiveProtocolSummary, ExistingSupplementSummary, TimeBlockSummary };
