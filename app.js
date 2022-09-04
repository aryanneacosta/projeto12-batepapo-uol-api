import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect(() => {
    db = mongoClient.db("batepapoUOL");
});

const server = express();
server.use(cors());
server.use(json());

const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid('message', 'private_message')
});

server.get('/participants', async (req, res) => {
    try {
        const participantsList = await db.collection('participants').find().toArray();
        res.send(participantsList.map(value => ({
            ...value,
            _id: undefined
        })));
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post('/participants', async (req, res) => {
    const name = req.body;
    const username = req.body.name;

    try {
        //fazer validação usando joi se username é ou n uma string vazia
        const { error } = userSchema.validate(name);
        if(error !== undefined) {
            console.log(error);
            return res.sendStatus(422);
        }

        //verificar se ja existe alguém com o mesmo nome
        const alreadyParticipant = await db.collection('participants').findOne({name: username});
        if(alreadyParticipant) {
            return res.sendStatus(409);
        }

        await db.collection('participants').insertOne({name: username, lastStatus: Date.now()});

        db.collection('messages').insertOne({
            from: username,
            to: 'Todos',
            text: 'Entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')
        });

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(422);
    }
})

server.get('/messages', async (req, res) => {
    try {
        const messagesList = await db.collection('messages').find().toArray();
        res.send(messagesList.map(value => ({
            ...value,
            _id: undefined
        })));
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post('/messages', async (req, res) => {
    const message = req.body;
    const { user: from } = req.headers;
    console.log(from)

    try {
        //validação do joi pra verificar to, text e type
        const { error } = messageSchema.validate(message);
        if(error !== undefined) {
            console.log(error);
            return res.sendStatus(422);
        }

        //validar se o participante já existe na lista
        const participantExist = await db.collection('participants').findOne({ name: from });
        if(!participantExist) {
            return res.sendStatus(422);
        }

        await db.collection('messages').insertOne({
            from: from,
            to: message.to,
            text: message.text,
            type: message.type,
            time: dayjs().format('HH:mm:ss')
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