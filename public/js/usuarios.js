document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/usuarios');
        const data = await response.json();
        
        const tbody = document.querySelector('#tabela-usuarios tbody');
        tbody.innerHTML = '';
        
        if (data.success && data.usuarios) {
            data.usuarios.forEach(usuario => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = usuario.id;
                row.insertCell(1).textContent = usuario.nome_completo;
                row.insertCell(2).textContent = usuario.cpf;
                row.insertCell(3).textContent = new Date(usuario.data_cadastro).toLocaleString();
            });
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar usuários');
    }
});