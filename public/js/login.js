document.addEventListener('DOMContentLoaded', () => {
    const tipoUsuario = document.getElementById('tipoUsuario');
    const campoTurma = document.getElementById('campoTurmaLogin');
    const turmaInput = document.getElementById('turmaLogin');
    
    tipoUsuario.addEventListener('change', () => {
        if (tipoUsuario.value === 'professor') {
            campoTurma.style.display = 'block';
            turmaInput.required = true;
        } else {
            campoTurma.style.display = 'none';
            turmaInput.required = false;
        }
    });
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cpf = document.getElementById('cpf').value;
        const senha = document.getElementById('senha').value;
        const tipo = tipoUsuario.value;
        const turma = tipo === 'professor' ? turmaInput.value : null;
        
        const messageDiv = document.getElementById('message');
        messageDiv.innerText = '';
        
        if (!cpf || !senha) {
            messageDiv.innerText = 'Preencha CPF e senha.';
            return;
        }
        if (tipo === 'professor' && !turma) {
            messageDiv.innerText = 'Informe a turma do professor.';
            return;
        }
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf, senha, tipo, turma })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('loggedUser', JSON.stringify(data.usuario));
                if (data.usuario.tipo === 'aluno') {
                    window.location.href = '/aluno';
                } else if (data.usuario.tipo === 'professor') {
                    window.location.href = '/professor';
                }
            } else {
                messageDiv.innerText = data.message;
            }
        } catch (error) {
            console.error(error);
            messageDiv.innerText = 'Erro de conexão com o servidor.';
        }
    });
    
    document.getElementById('btn-cadastro').addEventListener('click', () => {
        window.location.href = '/cadastro';
    });
});