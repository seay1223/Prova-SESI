document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cpf = document.getElementById('cpf').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cpf })
                });
                const data = await response.json();
                
                if (data.success) {
                    alert('Login realizado com sucesso!');
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert('Erro ao realizar login');
            }
        });
    }
    
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const cpf = document.getElementById('cpf').value;
            
            try {
                const response = await fetch('/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_completo: nome, cpf: cpf })
                });
                const data = await response.json();
                
                if (data.success) {
                    alert('Cadastro realizado com sucesso!');
                    window.location.href = '/';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert('Erro ao cadastrar');
            }
        });
    }
    
    const btnCadastro = document.getElementById('btn-cadastro');
    if (btnCadastro) {
        btnCadastro.addEventListener('click', () => {
            window.location.href = '/cadastro';
        });
    }
    
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{2})$/, '$1-$2');
                e.target.value = value;
            }
        });
    }
});