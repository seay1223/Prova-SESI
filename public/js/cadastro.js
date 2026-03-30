document.addEventListener('DOMContentLoaded', () => {
    const tipoUsuario = document.getElementById('tipoUsuario');
    const campoTurma = document.getElementById('campoTurmaCadastro');
    const turmaInput = document.getElementById('turma');
    
    tipoUsuario.addEventListener('change', () => {
        if (tipoUsuario.value === 'professor') {
            campoTurma.style.display = 'block';
            turmaInput.required = true;
        } else {
            campoTurma.style.display = 'none';
            turmaInput.required = false;
        }
    });
    
    document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const cpf = document.getElementById('cpf').value;
        const senha = document.getElementById('senha').value;
        const tipo = tipoUsuario.value;
        const turma = tipo === 'professor' ? turmaInput.value : null;
        
        const messageDiv = document.getElementById('message');
        messageDiv.innerText = '';
        
        if (!nome || !cpf || !senha) {
            messageDiv.innerText = 'Preencha todos os campos.';
            return;
        }
        
        try {
            const response = await fetch('/api/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_completo: nome, cpf, senha, tipo, turma })
            });
            
            const data = await response.json();
            if (data.success) {
                messageDiv.innerText = 'Cadastro realizado! Faça login.';
                setTimeout(() => window.location.href = '/', 1500);
            } else {
                messageDiv.innerText = data.message;
            }
        } catch (error) {
            console.error(error);
            messageDiv.innerText = 'Erro de conexão com o servidor.';
        }
    });
    
    document.getElementById('btn-voltar').addEventListener('click', () => {
        window.location.href = '/';
    });
});