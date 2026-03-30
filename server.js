const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'W0rk#57@1on',
    database: 'prova_sesi'
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('✅ Conectado ao MySQL (prova_sesi)');
});

// ==================== ROTAS DE PÁGINAS ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/cadastro.html'));
});

app.get('/aluno', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/aluno.html'));
});

app.get('/professor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/professor.html'));
});

app.get('/usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/usuarios.html'));
});

// ==================== API USUÁRIOS ====================
// Listar todos os usuários
app.get('/api/usuarios', (req, res) => {
    connection.query('SELECT id, nome_completo, cpf, tipo, turma FROM usuarios ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
        res.json({ success: true, usuarios: results });
    });
});

// Cadastro de novo usuário
app.post('/api/cadastro', async (req, res) => {
    const { nome_completo, cpf, senha, tipo, turma } = req.body;

    // Validações básicas
    if (!nome_completo || !cpf || !senha || !tipo) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
    }

    // Verificar se CPF já existe
    connection.query('SELECT * FROM usuarios WHERE cpf = ?', [cpf], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro no servidor' });
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'CPF já cadastrado' });
        }

        // Hash da senha
        const hash = await bcrypt.hash(senha, 10);
        const query = 'INSERT INTO usuarios (nome_completo, cpf, senha, tipo, turma) VALUES (?, ?, ?, ?, ?)';
        connection.query(query, [nome_completo, cpf, hash, tipo, turma || null], (err, result) => {
            if (err) {
                console.error('Erro ao inserir:', err);
                return res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário' });
            }
            res.json({ success: true, message: 'Cadastro realizado com sucesso' });
        });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { cpf, senha, tipo, turma } = req.body;

    if (!cpf || !senha || !tipo) {
        return res.status(400).json({ success: false, message: 'CPF, senha e tipo são obrigatórios' });
    }

    connection.query('SELECT * FROM usuarios WHERE cpf = ? AND tipo = ?', [cpf, tipo], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro no servidor' });
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'CPF ou tipo inválido' });
        }

        const user = results[0];
        const match = await bcrypt.compare(senha, user.senha);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Senha incorreta' });
        }

        // Se for professor e turma foi enviada, verificar se corresponde (opcional)
        if (tipo === 'professor' && turma && user.turma !== turma) {
            return res.status(401).json({ success: false, message: 'Turma não confere com o cadastro' });
        }

        // Remover senha do objeto retornado
        delete user.senha;
        res.json({ success: true, message: 'Login realizado', usuario: user });
    });
});

// ==================== API PROFESSOR ====================
// Listar provas de um professor
app.get('/api/professor/provas/:professor_id', (req, res) => {
    const { professor_id } = req.params;
    connection.query(
        `SELECT p.*, 
        (SELECT COUNT(*) FROM questoes WHERE prova_id = p.id) as total_questoes
        FROM provas p 
        WHERE p.professor_id = ? 
        ORDER BY p.data_criacao DESC`,
        [professor_id],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar provas' });
            res.json({ success: true, provas: results });
        }
    );
});

// Criar nova prova (com questões)
app.post('/api/professor/provas', (req, res) => {
    const { titulo, descricao, turma_destino, professor_id, questoes } = req.body;

    if (!titulo || !turma_destino || !professor_id || !questoes || !Array.isArray(questoes) || questoes.length === 0) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    connection.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao iniciar transação' });

        const insertProva = 'INSERT INTO provas (titulo, descricao, turma_destino, professor_id) VALUES (?, ?, ?, ?)';
        connection.query(insertProva, [titulo, descricao, turma_destino, professor_id], (err, result) => {
            if (err) {
                return connection.rollback(() => res.status(500).json({ success: false, message: 'Erro ao criar prova' }));
            }
            const provaId = result.insertId;

            const insertQuestoes = 'INSERT INTO questoes (prova_id, pergunta, resposta_correta) VALUES ?';
            const values = questoes.map(q => [provaId, q.pergunta, q.resposta_correta]);

            connection.query(insertQuestoes, [values], (err) => {
                if (err) {
                    return connection.rollback(() => res.status(500).json({ success: false, message: 'Erro ao inserir questões' }));
                }
                connection.commit(err => {
                    if (err) return connection.rollback(() => res.status(500).json({ success: false, message: 'Erro ao finalizar transação' }));
                    res.json({ success: true, message: 'Prova criada com sucesso', provaId });
                });
            });
        });
    });
});

// ==================== API ALUNO ====================
// Listar provas disponíveis para a turma do aluno
app.get('/api/aluno/provas/:aluno_id', (req, res) => {
    const { aluno_id } = req.params;
    connection.query('SELECT turma FROM usuarios WHERE id = ?', [aluno_id], (err, turmaResult) => {
        if (err || turmaResult.length === 0) {
            return res.status(500).json({ success: false, message: 'Aluno não encontrado' });
        }
        const turma = turmaResult[0].turma;

        connection.query(
            `SELECT p.*, u.nome_completo as professor_nome
            FROM provas p
            JOIN usuarios u ON p.professor_id = u.id
            WHERE p.turma_destino = ?
            ORDER BY p.data_criacao DESC`,
            [turma],
            (err, provas) => {
                if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar provas' });
                res.json({ success: true, provas });
            }
        );
    });
});

// Obter questões de uma prova
app.get('/api/provas/:prova_id/questoes', (req, res) => {
    const { prova_id } = req.params;
    connection.query('SELECT id, pergunta FROM questoes WHERE prova_id = ?', [prova_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar questões' });
        res.json({ success: true, questoes: results });
    });
});

// Enviar respostas do aluno
app.post('/api/aluno/respostas', (req, res) => {
    const { aluno_id, prova_id, respostas } = req.body;
    if (!aluno_id || !prova_id || !Array.isArray(respostas) || respostas.length === 0) {
        return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }

    // Buscar questões com respostas corretas
    connection.query('SELECT id, resposta_correta FROM questoes WHERE prova_id = ?', [prova_id], (err, questoes) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar questões' });

        const questoesMap = new Map(questoes.map(q => [q.id, q.resposta_correta]));
        const respostasParaInserir = [];
        let acertos = 0;

        for (const r of respostas) {
            const correta = questoesMap.get(r.questao_id) === r.resposta;
            if (correta) acertos++;
            respostasParaInserir.push([aluno_id, prova_id, r.questao_id, r.resposta, correta]);
        }

        const nota = (acertos / questoes.length) * 10; // Nota de 0 a 10

        connection.beginTransaction(err => {
            if (err) return res.status(500).json({ success: false, message: 'Erro ao iniciar transação' });

            // Inserir respostas (IGNORE para evitar duplicidade)
            const insertRespostas = 'INSERT IGNORE INTO respostas (aluno_id, prova_id, questao_id, resposta_aluno, correta) VALUES ?';
            connection.query(insertRespostas, [respostasParaInserir], (err) => {
                if (err) {
                    return connection.rollback(() => res.status(500).json({ success: false, message: 'Erro ao salvar respostas' }));
                }

                // Inserir ou atualizar resultado
                const insertResultado = `
                    INSERT INTO resultados (aluno_id, prova_id, nota)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE nota = VALUES(nota), data_fim = CURRENT_TIMESTAMP
                `;
                connection.query(insertResultado, [aluno_id, prova_id, nota], (err) => {
                    if (err) {
                        return connection.rollback(() => res.status(500).json({ success: false, message: 'Erro ao salvar resultado' }));
                    }
                    connection.commit(err => {
                        if (err) return connection.rollback(() => res.status(500).json({ success: false, message: 'Erro ao finalizar transação' }));
                        res.json({ success: true, message: 'Respostas salvas', nota });
                    });
                });
            });
        });
    });
});

// Obter notas do aluno
app.get('/api/aluno/notas/:aluno_id', (req, res) => {
    const { aluno_id } = req.params;
    connection.query(
        `SELECT r.nota, p.titulo, p.data_criacao, u.nome_completo as professor_nome
        FROM resultados r
        JOIN provas p ON r.prova_id = p.id
        JOIN usuarios u ON p.professor_id = u.id
        WHERE r.aluno_id = ?
        ORDER BY r.data_fim DESC`,
        [aluno_id],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar notas' });
            res.json({ success: true, notas: results });
        }
    );
});

// Listar todas as turmas disponíveis (para selects)
app.get('/api/turmas', (req, res) => {
    connection.query('SELECT DISTINCT turma FROM usuarios WHERE turma IS NOT NULL AND turma != ""', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar turmas' });
        const turmas = results.map(r => r.turma);
        res.json({ success: true, turmas });
    });
});

// ==================== ADMIN (opcional) ====================
// Endpoint para resetar banco (apenas para desenvolvimento)
app.post('/api/admin/reset', (req, res) => {
    const queries = [
        'SET FOREIGN_KEY_CHECKS = 0',
        'TRUNCATE TABLE respostas',
        'TRUNCATE TABLE resultados',
        'TRUNCATE TABLE questoes',
        'TRUNCATE TABLE provas',
        'TRUNCATE TABLE usuarios',
        'ALTER TABLE usuarios AUTO_INCREMENT = 1',
        'ALTER TABLE provas AUTO_INCREMENT = 1',
        'ALTER TABLE questoes AUTO_INCREMENT = 1',
        'ALTER TABLE respostas AUTO_INCREMENT = 1',
        'ALTER TABLE resultados AUTO_INCREMENT = 1',
        'SET FOREIGN_KEY_CHECKS = 1'
    ];
    
    let completed = 0;
    queries.forEach(query => {
        connection.query(query, (err) => {
            if (err) console.log('Erro no reset:', err);
            completed++;
            if (completed === queries.length) {
                res.json({ success: true, message: 'Banco de dados resetado com sucesso!' });
            }
        });
    });
});

// Endpoint para deletar usuário por CPF (admin)
app.delete('/api/admin/usuario/cpf/:cpf', (req, res) => {
    const { cpf } = req.params;
    connection.query('SELECT id, nome_completo, tipo FROM usuarios WHERE cpf = ?', [cpf], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'CPF não encontrado' });
        
        const user = results[0];
        connection.query('DELETE FROM usuarios WHERE cpf = ?', [cpf], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Erro ao deletar usuário' });
            res.json({ success: true, message: `Usuário ${user.nome_completo} (${user.tipo}) deletado com sucesso`, usuario_deletado: user });
        });
    });
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});