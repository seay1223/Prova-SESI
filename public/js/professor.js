document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sessão
    const resCheck = await fetch('/api/turmas');
    if (resCheck.status === 403) window.location.href = '/';

    // Carregar turmas
    const turmaSelect = document.getElementById('turmaSelect');
    const resTurmas = await fetch('/api/turmas');
    const dataTurmas = await resTurmas.json();
    if (dataTurmas.success) {
        dataTurmas.turmas.forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.textContent = t;
            turmaSelect.appendChild(option);
        });
    }

    turmaSelect.addEventListener('change', async () => {
        const turma = turmaSelect.value;
        if (!turma) return;
        const resAlunos = await fetch(`/api/alunos/${turma}`);
        const dataAlunos = await resAlunos.json();
        const infoDiv = document.getElementById('infoTurma');
        infoDiv.innerHTML = `<h3>Alunos da turma ${turma}</h3><ul>${dataAlunos.alunos.map(a => `<li>${a.nome_completo} (${a.cpf})</li>`).join('')}</ul>`;
        // Carregar notas da turma
        const resNotas = await fetch(`/api/notas/professor/${turma}`);
        const dataNotas = await resNotas.json();
        const notasDiv = document.getElementById('notasTurma');
        if (dataNotas.success && dataNotas.notas.length) {
            let html = '<h3>Notas dos Alunos</h3><table><tr><th>Aluno</th><th>Prova</th><th>Nota</th><th>Data</th></tr>';
            dataNotas.notas.forEach(n => {
                html += `<tr><td>${n.nome_completo}</td><td>${n.prova}</td><td>${n.nota}</td><td>${new Date(n.data_avaliacao).toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            notasDiv.innerHTML = html;
        } else {
            notasDiv.innerHTML = '<p>Nenhuma nota registrada para esta turma.</p>';
        }
    });

    // Modal de criação de prova
    const modal = document.getElementById('modalProva');
    const btnCriar = document.getElementById('btn-criar-prova');
    const closeSpan = modal.querySelector('.close-modal');
    btnCriar.onclick = () => modal.style.display = 'block';
    closeSpan.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    let perguntaCount = 1;
    document.getElementById('addPergunta').addEventListener('click', () => {
        const container = document.getElementById('perguntasContainer');
        const newDiv = document.createElement('div');
        newDiv.className = 'pergunta';
        newDiv.setAttribute('data-idx', perguntaCount++);
        newDiv.innerHTML = `
            <input type="text" placeholder="Enunciado" class="enunciado" required>
            <input type="text" placeholder="Opção A" class="opcao_a" required>
            <input type="text" placeholder="Opção B" class="opcao_b" required>
            <input type="text" placeholder="Opção C" class="opcao_c" required>
            <input type="text" placeholder="Opção D" class="opcao_d" required>
            <select class="resposta_correta">
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
            </select>
            <button type="button" class="removerPergunta">Remover</button>
        `;
        newDiv.querySelector('.removerPergunta').addEventListener('click', () => newDiv.remove());
        container.appendChild(newDiv);
    });

    document.getElementById('formProva').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('titulo').value;
        const descricao = document.getElementById('descricao').value;
        const data_inicio = document.getElementById('data_inicio').value;
        const data_fim = document.getElementById('data_fim').value;
        const turma = turmaSelect.value;
        if (!turma) return alert('Selecione uma turma antes');
        const perguntas = [];
        document.querySelectorAll('.pergunta').forEach(div => {
            perguntas.push({
                enunciado: div.querySelector('.enunciado').value,
                opcao_a: div.querySelector('.opcao_a').value,
                opcao_b: div.querySelector('.opcao_b').value,
                opcao_c: div.querySelector('.opcao_c').value,
                opcao_d: div.querySelector('.opcao_d').value,
                resposta_correta: div.querySelector('.resposta_correta').value
            });
        });
        if (perguntas.length === 0) return alert('Adicione pelo menos uma pergunta');
        const res = await fetch('/api/provas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, descricao, turma, data_inicio, data_fim, perguntas })
        });
        const data = await res.json();
        if (data.success) {
            alert('Prova criada com sucesso!');
            modal.style.display = 'none';
            location.reload();
        } else {
            alert(data.message || 'Erro ao criar prova');
        }
    });

    document.getElementById('btn-sair').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    });
});