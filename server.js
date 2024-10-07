

// Configurações do Express
const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect('mongodb://localhost:27017/security_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const ResourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    location: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);
const Resource = mongoose.model('Resource', ResourceSchema);

// Middleware para autenticação
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401); // Não autorizado

    jwt.verify(token, 'secreta', (err, user) => {
        if (err) return res.sendStatus(403); // Proibido
        req.user = user;
        next();
    });
}

// Rota de login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ username: user.username, role: user.role }, 'secreta');
    res.json({ token });
});

// Rota para obter recursos
app.get('/resources', authenticateToken, async (req, res) => {
    const resources = await Resource.find({});
    res.json(resources);
});

// Rota para criar um novo usuário (para fins de teste)
app.post('/users', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });

    try {
        await user.save();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar usuário', error });
    }
});

// Rota para criar um novo recurso (para fins de teste)
app.post('/resources', authenticateToken, async (req, res) => {
    const { name, type, location } = req.body;
    const resource = new Resource({ name, type, location });

    try {
        await resource.save();
        res.status(201).json({ message: 'Recurso criado com sucesso!' });
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar recurso', error });
    }
});

// Iniciando o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
