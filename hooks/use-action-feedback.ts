"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Feedback = { ok: true; message?: string } | { ok: false; error: string } | undefined;

/** Shows a toast for each new Server Action result and runs the matching callback. */
export function useActionFeedback(
	state: Feedback,
	onSuccess?: () => void,
	onError?: () => void,
) {
	useEffect(() => {
		if (!state) return;
		if (state.ok) {
			if (state.message) toast.success(state.message);
			onSuccess?.();
		} else {
			toast.error(state.error);
			onError?.();
		}
		// Only react to new results, not to new callback identities.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);
}
