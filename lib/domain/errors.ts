/** Expected business failure whose message is safe to show to the user. */
export class DomainError extends Error {
	override readonly name = "DomainError";
}
