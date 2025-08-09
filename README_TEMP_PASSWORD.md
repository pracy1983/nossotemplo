# Fluxo de Convite com Senha Temporária

## Resumo
A partir de agora, ao enviar um convite para um novo membro, o sistema gera automaticamente uma senha temporária segura, que é enviada junto com o link de convite no email.

## Como funciona
1. **Geração do Convite:**
   - O administrador preenche os dados do novo membro e envia o convite normalmente.
   - O sistema gera um token de convite (UUID v4) e uma senha temporária aleatória de 10 caracteres.

2. **Armazenamento:**
   - A senha temporária é armazenada junto ao registro do estudante no banco de dados, em um campo temporário (`tempPassword`).

3. **Envio do Email:**
   - O email de convite contém:
     - O link para aceitar o convite
     - A senha temporária gerada
     - Instrução para usar essa senha no primeiro acesso e alterá-la após o login

4. **Primeiro Acesso:**
   - O convidado acessa o link, faz login com o email e a senha temporária.
   - Após o login, será solicitado que altere a senha (essa parte será implementada posteriormente).

## Observações
- Nenhum layout, lógica de tela ou fluxo adicional foi alterado.
- O fluxo de redefinição de senha tradicional permanece disponível para casos de perda da senha temporária.

---

**Este arquivo descreve apenas a funcionalidade de senha temporária para convites.**
