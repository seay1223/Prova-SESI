const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

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
        console.log('Erro ao conectar:', err);
        return;
    }
    console.log('MySQL conectado');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/cadastro.html'));
});

app.get('/aluno', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/aluno.html'));
});

app.get('/usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/usuarios.html'));
});

app.get('/api/usuarios', (req, res) => {
    connection.query('SELECT * FROM usuarios ORDER BY id DESC', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro' });
        }
        res.json({ success: true, usuarios: results });
    });
});

app.post('/api/cadastro', (req, res) => {
    const { nome_completo, cpf } = req.body;
    
    connection.query('SELECT * FROM usuarios WHERE cpf = ?', [cpf], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro' });
        if (results.length > 0) return res.status(400).json({ success: false, message: 'CPF já cadastrado' });
        
        connection.query('INSERT INTO usuarios (nome_completo, cpf) VALUES (?, ?)', [nome_completo, cpf], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Erro' });
            res.json({ success: true, message: 'Cadastrado com sucesso' });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { cpf } = req.body;
    
    connection.query('SELECT * FROM usuarios WHERE cpf = ?', [cpf], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro' });
        if (results.length > 0) {
            res.json({ success: true, message: 'Login realizado', usuario: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'CPF não encontrado' });
        }
    });
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});