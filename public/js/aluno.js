document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sessão
    const resCheck = await fetch('/api/notificacoes/aluno');
    if (resCheck.status === 403) window.location.href = '/';

    let provas = [];
    let notas = [];

    // Carregar dados
    async function carregarProvas() {
        const res = await fetch('/api/provas/aluno');
        const data = await res.json();
        if (data.success) provas = data.provas;
    }
    async function carregarNotas() {
        const res = await fetch('/api/notas/aluno');
        const data = await res.json();
        if (data.success) notas = data.notas;
    }
    async function atualizarNotificacao() {
        const res = await fetch('/api/notificacoes/aluno');
        const data = await res.json();
        const badge = document.getElementById('badge');
        if (data.success && data.novas > 0) {
            badge.textContent = data.novas;
            badge.classList.add('ativo');
        } else {
            badge.textContent = '';
            badge.classList.remove('ativo');
        }
    }
    await Promise.all([carregarProvas(), carregarNotas()]);
    await atualizarNotificacao();

    // Modal
    const modal = document.getElementById('modal');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalBody = document.getElementById('modal-body');
    window.fecharModal = () => modal.style.display = 'none';

    function mostrarProvas() {
        modalTitulo.textContent = 'Provas Disponíveis';
        if (provas.length === 0) {
            modalBody.innerHTML = '<p>Nenhuma prova disponível no momento.</p>';
        } else {
            let html = '<div class="prova-lista">';
            provas.forEach(p => {
                const respondida = p.respondeu > 0;
                html += `
                    <div class="prova-item">
                        <strong>${p.titulo}</strong><br>
                        <small>Período: ${new Date(p.data_inicio).toLocaleString()} até ${new Date(p.data_fim).toLocaleString()}</small>
                        <p>${p.descricao || ''}</p>
                        ${!respondida ? `<button onclick="iniciarProva(${p.id})">Realizar Prova</button>` : '<em>Prova já realizada</em>'}
                    </div>
                `;
            });
            html += '</div>';
            modalBody.innerHTML = html;
        }
        modal.style.display = 'block';
    }

    window.iniciarProva = async (provaId) => {
        const res = await fetch(`/api/provas/${provaId}/perguntas`);
        const data = await res.json();
        if (!data.success) return alert('Erro ao carregar prova');
        const perguntas = data.perguntas;
        modalTitulo.textContent = 'Responder Prova';
        let html = '<form id="formRespostas">';
        perguntas.forEach((p, idx) => {
            html += `
                <div class="pergunta">
                    <p><strong>${idx+1}. ${p.enunciado}</strong></p>
                    <label><input type="radio" name="q${p.id}" value="a"> ${p.opcao_a}</label><br>
                    <label><input type="radio" name="q${p.id}" value="b"> ${p.opcao_b}</label><br>
                    <label><input type="radio" name="q${p.id}" value="c"> ${p.opcao_c}</label><br>
                    <label><input type="radio" name="q${p.id}" value="d"> ${p.opcao_d}</label>
                </div>
            `;
        });
        html += '<button type="submit">Enviar Respostas</button></form>';
        modalBody.innerHTML = html;
        document.getElementById('formRespostas').addEventListener('submit', async (e) => {
            e.preventDefault();
            const respostas = [];
            for (let p of perguntas) {
                const selected = document.querySelector(`input[name="q${p.id}"]:checked`);
                if (!selected) return alert('Responda todas as perguntas');
                respostas.push({ pergunta_id: p.id, resposta: selected.value });
            }
            const resSubmit = await fetch('/api/respostas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prova_id: provaId, respostas })
            });
            const submitData = await resSubmit.json();
            if (submitData.success) {
                alert(`Prova finalizada! Sua nota: ${submitData.nota.toFixed(2)}`);
                location.reload();
            } else {
                alert(submitData.message || 'Erro ao enviar respostas');
            }
        });
    };

    function mostrarNotas() {
        modalTitulo.textContent = 'Minhas Notas';
        if (notas.length === 0) {
            modalBody.innerHTML = '<p>Você ainda não possui notas.</p>';
        } else {
            let html = '<div class="notas-lista">';
            notas.forEach(n => {
                html += `
                    <div class="nota-item">
                        <strong>${n.titulo}</strong><br>
                        Nota: ${n.nota.toFixed(2)}<br>
                        Data: ${new Date(n.data_avaliacao).toLocaleString()}
                    </div>
                `;
            });
            html += '</div>';
            modalBody.innerHTML = html;
        }
        modal.style.display = 'block';
    }

    document.getElementById('card-prova').addEventListener('click', mostrarProvas);
    document.getElementById('card-notas').addEventListener('click', mostrarNotas);
    document.getElementById('notificacao').addEventListener('click', mostrarProvas);
    document.getElementById('btn-sair').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    });
});