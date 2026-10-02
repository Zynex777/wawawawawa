export default function Privacidade() {
  return (
    <div className="max-w-none">
      <h1 className="text-2xl font-bold">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-muted">Última atualização: 2026</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p>
          O Afiliado Multipost é uma ferramenta de uso pessoal para agendamento e publicação de vídeos
          promocionais de produtos de afiliado em redes sociais conectadas pelo próprio usuário.
        </p>

        <h2 className="text-base font-semibold">Quais dados o app guarda</h2>
        <p>
          Guardamos apenas: os tokens de acesso das contas de redes sociais que você mesmo conecta (para
          publicar em seu nome), os vídeos e legendas que você envia para publicação, e os links de produto
          que você cadastra. Não coletamos dados de terceiros nem de visitantes — só do próprio usuário
          conectado.
        </p>

        <h2 className="text-base font-semibold">Como os dados são usados</h2>
        <p>
          Os tokens de acesso são usados exclusivamente para publicar, em nome do usuário, os vídeos que ele
          mesmo escolhe, nas contas que ele mesmo conectou. Nenhum dado é vendido, compartilhado ou usado
          para publicidade.
        </p>

        <h2 className="text-base font-semibold">Armazenamento</h2>
        <p>
          Os dados ficam em um banco de dados privado (Supabase) e em um serviço de armazenamento de
          arquivos (Supabase Storage), acessíveis apenas pelo próprio usuário através de senha.
        </p>

        <h2 className="text-base font-semibold">Remoção de dados</h2>
        <p>
          Para desconectar uma conta de rede social ou remover um vídeo enviado, o usuário pode fazer isso
          diretamente pelo app. Para exclusão completa de dados, entre em contato através do contato abaixo.
        </p>

        <h2 className="text-base font-semibold">Contato</h2>
        <p>Dúvidas sobre esta política podem ser enviadas ao responsável pelo app.</p>
      </div>
    </div>
  );
}
