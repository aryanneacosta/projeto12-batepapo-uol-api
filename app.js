import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
    db.mongoClient.db('batepapoUOL');
});

const participants = [];

server.get('/participants', async (req, res) => {
    try {
        participants = await db.collection('participants').find().toArray();
        res.send(participants);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post('/participants', async (req, res) => {
    const name = req.body;
    const alreadyParticipant = participants.find(p => p.name === name.name);

    try {
        await db.collection('participants').insertOne({name, lastStatus: Date.now()});

        if(!name) {  
            return res.status(422);
        }

        if(alreadyParticipant) {
            return res.status(409);
        }

        db.collection('messages').insertOne({
            from: name.name,
            to: 'Todos',
            text: 'Entra na sala...',
            type: 'status',
            time: 'HH:MM:SS'
        });

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    }
})

server.listen(5000, () => {
    console.log('Rodando em http://localhost:5000');
});