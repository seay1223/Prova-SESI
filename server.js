const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/html/login.html');
});

app.get('/cadastro', (req, res) => {
  res.sendFile(__dirname + '/public/html/cadastro.html');
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});