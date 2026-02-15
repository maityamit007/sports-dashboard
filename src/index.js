import express from 'express';
import { matchRouter } from './routes/matches.js';
import http from 'http';
import { attachWebSockServer } from './ws/server.js';
import { commentaryRouter } from './routes/commentary.js';
import { securityMiddleware } from './arcjet.js';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
app.use(express.json())

const { broadcastMatchCreated } = attachWebSockServer(server);
app.locals.boradcastMatchCreated = broadcastMatchCreated;
// app.locals.boradcastMatchCreated = broadcastMatchCreated;

// app.use(securityMiddleware());
app.use('/matches', matchRouter);
app.use('/matches/:id/commentary', commentaryRouter);


server.listen(PORT, HOST, () => {
    const baseURL = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
    console.log(`Server running on : ${baseURL}`);
    console.log(`Websocket running on port : ${baseURL.replace('http' , 'ws')}/ws`);
})