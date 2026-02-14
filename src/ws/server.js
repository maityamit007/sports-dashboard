import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload))
}

function broadCast(wss, payload) {
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
                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access Denied'
                    socket.close(code, reason);
                    return;
                }

            } catch (e) {
                console.log('Ws connection error', e);
                socket.close(1011, 'Server security error ')
                return;
            }
        }
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true });
        sendJson(socket, { type: 'welcome' });
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
        broadCast(wss, { type: "match_created", data: match })
    }
    return { broadcastMatchCreated }
}