"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

type TermsModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onAccept: () => void;
};

export function TermsModal({
	isOpen,
	onOpenChange,
	onAccept,
}: TermsModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Termos de uso</DialogTitle>
					<DialogDescription>
						Leia e aceite para concluir seu cadastro
					</DialogDescription>
				</DialogHeader>
				<div className="border-y border-border py-3">
					<div className="-ml-8 -mr-6.5">
						<ScrollArea className="flex flex-col max-h-[70dvh]">
							<div className="space-y-3 pt-1 text-sm text-muted-foreground px-8">
								<p>
									O presente Termo de Uso regula o acesso e a utilização da
									plataforma AuAu Agenda, um sistema digital destinado ao
									agendamento de banho, tosa e serviços relacionados, cadastro de
									usuários e gerenciamento de informações relacionadas aos pets.
								</p>
								<p>
									Para utilizar os serviços, o usuário deverá fornecer dados
									pessoais como nome, CPF, e-mail e telefone, comprometendo-se a
									informar dados verdadeiros e atualizados. O usuário é
									responsável pela segurança de sua conta e por todas as
									atividades realizadas nela.
								</p>
								<p>
									O AuAu Agenda permite o cadastro de pets, incluindo informações
									como nome, espécie, raça, porte, data de nascimento e
									observações de cuidado. O usuário se responsabiliza pela
									veracidade dessas informações.
								</p>
								<p>
									A plataforma possibilita o agendamento de serviços do pet shop
									e o acompanhamento do status de cada atendimento. Os horários
									disponíveis dependem do expediente e da capacidade definidos
									pelo pet shop.
								</p>
								<p>
									Os dados pessoais são tratados conforme a Lei Geral de
									Proteção de Dados (Lei nº 13.709/2018), sendo utilizados para
									viabilizar o funcionamento da plataforma. O AuAu Agenda adota
									medidas de segurança para proteger essas informações, e o
									usuário pode solicitar acesso, correção ou exclusão de seus
									dados quando aplicável.
								</p>
								<p>
									A plataforma não garante funcionamento ininterrupto e não se
									responsabiliza por falhas técnicas, perda de dados ou uso
									indevido por parte do usuário.
								</p>
								<p>
									O descumprimento destes termos pode resultar na suspensão ou
									exclusão da conta. O AuAu Agenda pode alterar este Termo a
									qualquer momento, sendo responsabilidade do usuário acompanhar
									as atualizações.
								</p>
							</div>
						</ScrollArea>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						onClick={() => {
							onAccept();
							onOpenChange(false);
						}}
					>
						Aceitar termos
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
