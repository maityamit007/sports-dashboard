import express from 'express';
import { matchRouter } from './routes/matches.js';

const app = express();

app.use(express.json())

app.use('/', matchRouter);

app.listen(8080, () => {
    console.log('Listening to port 8080');
})