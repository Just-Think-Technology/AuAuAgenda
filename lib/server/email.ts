import "server-only";

import nodemailer from "nodemailer";

function requiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is not configured.`);
	return value;
}

function smtpTransport() {
	const port = Number(process.env.SMTP_PORT ?? 587);
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error("SMTP_PORT is invalid.");
	}
	const user = requiredEnv("SMTP_USER");
	return {
		from: process.env.SMTP_FROM?.trim() || user,
		transporter: nodemailer.createTransport({
			host: requiredEnv("SMTP_HOST"),
			port,
			secure: process.env.SMTP_SECURE?.toLowerCase() === "true" || port === 465,
			auth: { user, pass: requiredEnv("SMTP_PASS") },
		}),
	};
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export async function sendPasswordResetEmail(data: {
	to: string;
	name: string;
	resetUrl: string;
	expiresInMinutes: number;
}): Promise<void> {
	const { from, transporter } = smtpTransport();
	await transporter.sendMail({
		from,
		to: data.to,
		subject: "Recuperação de senha - AuAu Agenda",
		text: [
			`Olá, ${data.name}.`,
			"",
			"Recebemos uma solicitação para redefinir a senha da sua conta.",
			`Acesse o link abaixo em até ${data.expiresInMinutes} minutos para criar uma nova senha:`,
			data.resetUrl,
			"",
			"Se você não solicitou essa alteração, ignore este e-mail.",
		].join("\n"),
		html: `
			<p>Olá, ${escapeHtml(data.name)}.</p>
			<p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
			<p>Acesse o link abaixo em até ${data.expiresInMinutes} minutos para criar uma nova senha:</p>
			<p><a href="${escapeHtml(data.resetUrl)}">Redefinir senha</a></p>
			<p>Se você não solicitou essa alteração, ignore este e-mail.</p>
		`,
	});
}
