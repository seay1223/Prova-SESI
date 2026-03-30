document.addEventListener('DOMContentLoaded', function() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    
    // Corrigido: verifica nome_completo em vez de nome
    if (!usuarioLogado.nome_completo) {
        window.location.href = '/';
        return;
    }

    function verificarProva() {
        const temProva = localStorage.getItem('temProva') === 'true';
        const badge = document.getElementById('badge');
        
        if (temProva) {
            badge.textContent = '1';
            badge.classList.add('ativo');
        } else {
            badge.textContent = '';
            badge.classList.remove('ativo');
        }
    }

    function mostrarModal(titulo, mensagem) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-titulo').textContent = titulo;
        document.getElementById('modal-mensagem').textContent = mensagem;
        modal.style.display = 'block';
    }

    window.fecharModal = function() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
    }

    const cardProva = document.getElementById('card-prova');
    if (cardProva) {
        cardProva.addEventListener('click', () => {
            const temProva = localStorage.getItem('temProva') === 'true';
            
            if (temProva) {
                mostrarModal('Prova Disponível', 'Você tem uma prova para realizar.');
            } else {
                mostrarModal('Sem Provas', 'Não há provas disponíveis no momento.');
            }
        });
    }

    const cardNotas = document.getElementById('card-notas');
    if (cardNotas) {
        cardNotas.addEventListener('click', () => {
            const notas = JSON.parse(localStorage.getItem(`notas_${usuarioLogado.cpf}`) || '[]');
            
            if (notas.length > 0) {
                let mensagem = '';
                notas.forEach((nota, index) => {
                    mensagem += `Prova ${index + 1}: ${nota.nota} pontos\n`;
                });
                mostrarModal('Suas Notas', mensagem);
            } else {
                mostrarModal('Sem Notas', 'Você ainda não possui notas cadastradas.');
            }
        });
    }

    const notificacao = document.getElementById('notificacao');
    if (notificacao) {
        notificacao.addEventListener('click', () => {
            const temProva = localStorage.getItem('temProva') === 'true';
            
            if (temProva) {
                mostrarModal('Nova Prova!', 'Você tem uma nova prova disponível para realizar.');
            } else {
                mostrarModal('Notificações', 'Não há novas notificações.');
            }
        });
    }

    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('temProva');
            window.location.href = '/';
        });
    }

    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    verificarProva();
});