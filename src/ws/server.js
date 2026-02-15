import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../arcjet.js";

let matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket)
}

function unSubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);

    if (!subscribers) return;

    subscribers.delete(socket);
    if (subscribers.size === 0) {
        matchSubscribers.delete(matchId)
    }
}

function cleanUpSubscriptions(socket) {
    for (let matchId of socket.subscription) {
        unSubscribe(matchId, socket);
    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (subscribers.size === 0 || !subscribers) return;
    const message = JSON.stringify(payload);

    for (let client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    }
}

function handleMessage(socket, data) {
    let message;

    try {
        message = JSON.parse(data.toString());
    } catch {
        sendJson(socket, { type: 'error', message: 'Invalid JSON' })
    }

    if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: 'subscribed', matchId: message.matchId })
    }
    if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, { type: 'unsubscribed', matchId: message.matchId })
    }
}


function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload))
}

function broadcastAll(wss, payload) {
    for (const client of wss.clients) {
        if (socket.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringfy(payload));
    }
}

export function attachWebSockServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024
    })
    wss.on('connection', async (socket) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect();
                console.log('decision', decision);
                
                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access Denied'
                    socket.close(code, reason);
                    return;
                }

            } catch (e) {
                console.log('Ws connection error', e);
                socket.close(1011, `Server security error: ${e.message}`)
                return;
            }
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        }
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true });
        socket.subscriptions = new Set();

        sendJson(socket, { type: 'welcome' });

        socket.on('message', () => {
            handleMessage(socket, data);
        })
        socket.on('error', () => {
            socket.terminate();
        })
        socket.on('close', () => {
            cleanUpSubscriptions(socket);
        })

        socket.on('error', console.error);
    })

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        })
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcastAll(wss, { type: "match_created", data: match })
    }

    function broadcastCommentary(matchId, comment) {
        broadcastToMatch(matchId, { type: 'commentary', data: comment });
    }
    return { broadcastMatchCreated, broadcastCommentary }
}