const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();


app.use(cookieParser());
app.use(session({
    secret: 'segredo-unico',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 } 
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


const usuarios = [];
const mensagens = [];
const logins = [{ username: 'admin', password: '1234' }];


const authMiddleware = (req, res, next) => {
    if (req.session.loggedIn) return next();
    res.redirect('/login.html');
};


app.get('/cadastroUsuario.html', (req, res) => res.sendFile(path.join(__dirname, 'public/cadastroUsuario.html')));

app.post('/cadastrarUsuario', (req, res) => {
    const { nome, dataNascimento, nickname } = req.body;

    if (!nome || !dataNascimento || !nickname) {
        return res.send(`<h3>Preencha todos os campos!</h3><a href="/cadastroUsuario.html">Voltar</a>`);
    }

    const nomeLimpo = nome.trim();
    const nicknameLimpo = nickname.trim();

    if (!nomeLimpo || !nicknameLimpo) {
        return res.send(`<h3>Preencha todos os campos corretamente!</h3><a href="/cadastroUsuario.html">Voltar</a>`);
    }

    const usuarioExistente = logins.find(user => user.username === nicknameLimpo);
    if (usuarioExistente) {
        return res.send(`<h3>Apelido já cadastrado!</h3><a href="/cadastroUsuario.html">Voltar</a>`);
    }

    usuarios.push({ nome: nomeLimpo, dataNascimento, nickname: nicknameLimpo });
    logins.push({ username: nicknameLimpo, password: '1234' });

    res.send(`
        <h3>Usuário cadastrado com sucesso!</h3>
        <p>Apelido: ${nicknameLimpo} | Senha padrão: 1234</p>
        <a href="/login.html">Faça login aqui</a>
    `);

    console.log('Logins:', logins);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const usuario = logins.find(user => user.username === username && user.password === password);

    if (usuario) {
        req.session.loggedIn = true; 
        req.session.username = username; 
        req.session.lastAccess = new Date().toLocaleString(); 
        res.redirect('/menu.html');
    } else {
        res.send('<h3>Credenciais inválidas!</h3><a href="/login.html">Tente novamente</a>');
    }
});

app.get('/menu.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/menu.html'));
});


app.get('/chat.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/chat.html'));
});

app.get('/api/usuarios', authMiddleware, (req, res) => {
    res.json(usuarios);
});

app.get('/api/mensagens', (req, res) => {
    const query = 'SELECT usuario, mensagem, data FROM messages ORDER BY id ASC';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar mensagens:', err.message);
            res.status(500).send('Erro ao buscar mensagens');
        } else {
            res.status(200).json(rows);
        }
    });
});


app.post('/api/postarMensagem', (req, res) => {
    console.log('Requisição recebida no endpoint /api/postarMensagem');
    console.log('Headers:', req.headers);
    console.log('Corpo da Requisição:', req.body);

    const { usuario, mensagem } = req.body;

    if (!usuario || !mensagem) {
        console.log('Erro: Usuário ou mensagem está vazio.');
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    mensagens.push({ usuario, mensagem, data: new Date().toLocaleString() });
   
    const novaMensagem = {
        usuario,
        mensagem,
        data: new Date().toLocaleString(), 
    };

    mensagens.push(novaMensagem); 
    console.log('Mensagem salva:', novaMensagem);
    res.status(201).json({ message: 'Mensagem postada com sucesso.' });

});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});



const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
