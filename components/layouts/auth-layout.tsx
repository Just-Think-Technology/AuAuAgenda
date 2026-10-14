import Image from "next/image";

import logo from "@/assets/logo.png";

type AuthLayoutProps = {
	title: string;
	description: React.ReactNode;
	children: React.ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
	return (
		<main className="flex flex-col my-10 md:my-20 px-4 sm:px-6">
			<div className="flex flex-col justify-center gap-8 md:gap-10 mt-10 md:mt-20 max-w-lg mx-auto w-full">
				<div className="flex flex-col gap-2">
					<Image
						src={logo}
						alt="logo"
						width={100}
						height={100}
						className="w-14 mb-4"
					/>
					<h1 className="text-4xl font-semibold tracking-tight text-black">
						{title}
					</h1>
					<p className="text-muted-foreground text-balance">{description}</p>
				</div>

				{children}
			</div>
		</main>
	);
}
