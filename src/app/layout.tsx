import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ServiceWorkerRegistrar } from "@/shared/components/service-worker-registrar";
import { cn } from "@/shared/lib/utils";
import "./globals.css";
import { Toaster } from "sonner";

const dmSerif = DM_Serif_Display({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-display-face",
});

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-body-face",
});

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("seo");

	return {
		title: {
			default: t("title"),
			template: t("titleTemplate"),
		},
		description: t("description"),
		applicationName: "PillPilot",
		keywords: t("keywords").split(", "),
		authors: [{ name: "PillPilot" }],
		openGraph: {
			type: "website",
			locale: "pl_PL",
			siteName: "PillPilot",
			title: t("title"),
			description: t("shortDescription"),
			images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PillPilot" }],
		},
		twitter: {
			card: "summary_large_image",
			title: t("title"),
			description: t("shortDescription"),
			images: ["/og-image.png"],
		},
		metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
	};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<body
				className={cn(
					dmSerif.variable,
					plusJakarta.variable,
					"font-body bg-surface text-content overflow-x-hidden",
				)}
			>
				<NuqsAdapter>
					<NextIntlClientProvider messages={messages}>
						<ServiceWorkerRegistrar />
						<Toaster richColors />
						{children}
					</NextIntlClientProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
