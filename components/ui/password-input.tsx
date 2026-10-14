"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordInput({
	className,
	...props
}: PasswordInputProps) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="relative">
			<Input
				type={showPassword ? "text" : "password"}
				className={`pr-10 ${className ?? ""}`}
				{...props}
			/>
			<button
				type="button"
				onClick={() => setShowPassword((prev) => !prev)}
				aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
			>
				{showPassword ? (
					<EyeOff className="h-4 w-4" />
				) : (
					<Eye className="h-4 w-4" />
				)}
			</button>
		</div>
	);
}
