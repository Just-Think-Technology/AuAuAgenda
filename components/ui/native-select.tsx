import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Native `<select>` styled like `Input`; submits with plain HTML forms and works without JS. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
	return (
		<div className="relative w-full">
			<select
				data-slot="native-select"
				className={cn(
					"border-input h-9 w-full appearance-none rounded-[10px] border bg-transparent pl-3 pr-9 text-base outline-none transition-[color,box-shadow] md:text-sm",
					"focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
					"aria-invalid:border-destructive",
					className,
				)}
				{...props}
			>
				{children}
			</select>
			<ChevronDownIcon
				aria-hidden
				className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50"
			/>
		</div>
	);
}

export { NativeSelect };
