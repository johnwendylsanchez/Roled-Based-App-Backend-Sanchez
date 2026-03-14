const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
const cors = require ('cors');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-key-secure-secret';



app.use(cors({
    origin: ['https://127.0.0.1:5500', 'https://localhost:5500']


}));

app.use(express.json());




let users = [

    {id: 1, username: 'admin', password: '$2a$10$...', role: 'admin'},
    {id: 2, username: 'jeric', password: '$2a$10$...', role: 'user'}

];

if (!user [0].password.includes('$2a$') ){
    users[0].password = bcrypt.hashSync('admin123', 10);
     users[1].password = bcrypt.hashSync('user123', 10);
};




app.post('/api/register', async(req, res) => {
    const {username, password, role = 'user'} = req.body;

    if (!username || !password) {
        return res.status(400).json({error: 'Username and Password required'});
    }
    

const existing = users.find(u => u.username === username);
if (existing) {
    return res.status(409).json({errpr: 'User already exists'});
}    


const hashPassword = await bcrypt.hash(password, 10);
const newUser = {
    id: users.length + 1,
    username,
    password, hashPassword,
    role
};


users.push(newUser);
res.status(201).json({message: 'User registered', username, role });

});


app.post('/api/login', async (req,res) => {
    const {username, password} = req.body;
    const user = users.find(u => u.username === username);
    
     if (!user || !await bcrypt.compare(password, user.password)){
        return res.status(401).json({error: 'Invalid credentials'});

     }

     
});