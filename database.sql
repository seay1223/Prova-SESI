-- Criação do banco (se não existir)
CREATE DATABASE IF NOT EXISTS prova_sesi;
USE prova_sesi;

-- Tabela de usuários (alunos e professores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('aluno', 'professor') NOT NULL,
    turma VARCHAR(50) NULL,  -- apenas para alunos
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de provas
CREATE TABLE IF NOT EXISTS provas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    turma VARCHAR(50) NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    criado_por INT NOT NULL,  -- id do professor que criou
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de perguntas (cada prova tem várias perguntas)
CREATE TABLE IF NOT EXISTS perguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prova_id INT NOT NULL,
    enunciado TEXT NOT NULL,
    opcao_a VARCHAR(255) NOT NULL,
    opcao_b VARCHAR(255) NOT NULL,
    opcao_c VARCHAR(255) NOT NULL,
    opcao_d VARCHAR(255) NOT NULL,
    resposta_correta CHAR(1) NOT NULL, -- 'a','b','c','d'
    FOREIGN KEY (prova_id) REFERENCES provas(id) ON DELETE CASCADE
);

-- Tabela de respostas dos alunos
CREATE TABLE IF NOT EXISTS respostas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    prova_id INT NOT NULL,
    pergunta_id INT NOT NULL,
    resposta CHAR(1) NOT NULL,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (prova_id) REFERENCES provas(id) ON DELETE CASCADE,
    FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_resposta (aluno_id, pergunta_id) -- cada aluno responde uma vez por pergunta
);

-- Tabela de notas (calculada a partir das respostas)
CREATE TABLE IF NOT EXISTS notas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    prova_id INT NOT NULL,
    nota DECIMAL(5,2) NOT NULL,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (prova_id) REFERENCES provas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nota (aluno_id, prova_id)
);

-- Índices para performance
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_turma ON usuarios(turma);
CREATE INDEX idx_provas_turma ON provas(turma);
CREATE INDEX idx_respostas_aluno ON respostas(aluno_id);