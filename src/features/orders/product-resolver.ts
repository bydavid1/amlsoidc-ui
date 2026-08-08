export interface ResolveProductInput {
	url: string;
	prefillName?: string;
	prefillPrice?: number;
	prefillImageUrl?: string;
}

export interface ResolvedProduct {
	productName: string | null;
	storeName: string | null;
	purchaseCountryIso2: string | null;
	priceAmount: number | null;
	imageUrl: string | null;
	confidence: "high" | "low";
}

export type ProductResolution =
	| { status: "resolved"; data: ResolvedProduct }
	| { status: "unresolved"; reason: "unsupported_domain" | "insufficient_data" };

export interface ProductResolver {
	resolve(input: ResolveProductInput): Promise<ProductResolution>;
}

interface DomainHint {
	suffix: string;
	storeName: string;
	iso2: string;
	confidence: "high" | "low";
}

const DOMAIN_HINTS: DomainHint[] = [
	{ suffix: "amazon.com", storeName: "Amazon", iso2: "US", confidence: "high" },
	{ suffix: "amazon.es", storeName: "Amazon", iso2: "ES", confidence: "high" },
	{ suffix: "amazon.com.mx", storeName: "Amazon", iso2: "MX", confidence: "high" },
	{ suffix: "amazon.de", storeName: "Amazon", iso2: "DE", confidence: "high" },
	{ suffix: "walmart.com", storeName: "Walmart", iso2: "US", confidence: "high" },
	{ suffix: "bestbuy.com", storeName: "Best Buy", iso2: "US", confidence: "high" },
	{ suffix: "ebay.com", storeName: "eBay", iso2: "US", confidence: "high" },
	{ suffix: "apple.com", storeName: "Apple", iso2: "US", confidence: "low" },
];

function cleanPathSegment(raw: string): string {
	return raw
		.replace(/[-_]+/g, " ")
		.replace(/\b(dp|gp|product|products|shop|buy)\b/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function inferProductName(url: URL): string | null {
	const segments = url.pathname.split("/").filter(Boolean);
	const candidate = [...segments].reverse().map(cleanPathSegment).find((segment) => segment.length >= 4);
	return candidate ? decodeURIComponent(candidate) : null;
}

function findDomainHint(hostname: string): DomainHint | null {
	const normalized = hostname.toLowerCase();
	const match = DOMAIN_HINTS.find((hint) => normalized === hint.suffix || normalized.endsWith(`.${hint.suffix}`));
	return match ?? null;
}

export class LocalProductResolver implements ProductResolver {
	async resolve(input: ResolveProductInput): Promise<ProductResolution> {
		let parsed: URL;
		try {
			parsed = new URL(input.url);
		} catch {
			return { status: "unresolved", reason: "insufficient_data" };
		}

		const hint = findDomainHint(parsed.hostname);
		if (!hint) {
			return { status: "unresolved", reason: "unsupported_domain" };
		}

		const productName = input.prefillName?.trim() || inferProductName(parsed) || null;
		const priceAmount =
			typeof input.prefillPrice === "number" && Number.isFinite(input.prefillPrice) && input.prefillPrice > 0
				? input.prefillPrice
				: null;
		const imageUrl = input.prefillImageUrl?.trim() || null;

		return {
			status: "resolved",
			data: {
				productName,
				storeName: hint.storeName,
				purchaseCountryIso2: hint.iso2,
				priceAmount,
				imageUrl,
				confidence: hint.confidence,
			},
		};
	}
}

export const productResolver: ProductResolver = new LocalProductResolver();
