import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ServiceWorkerRegistrar } from "@/shared/components/service-worker-registrar";
import { cn } from "@/shared/lib/utils";
import "./globals.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";

const dmSerif = DM_Serif_Display({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-display-face",
});

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-body-face",
});

export const metadata: Metadata = {
	title: "PillPilot",
	description: "Twój dzienny pilot suplementów",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<body
				className={cn(dmSerif.variable, plusJakarta.variable, "font-body bg-surface text-content")}
			>
				<NextIntlClientProvider messages={messages}>
					<ServiceWorkerRegistrar />
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
