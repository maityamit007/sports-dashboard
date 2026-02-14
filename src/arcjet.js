import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) throw new Error('Arcjet key is missing');

export const httpArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 })
        ]
    }) : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 })
        ]
    }) : null;


    for(let i = 0; i< 10; i++){
    const ws = webSocket('ws://localhost:8080/ws');
    ws.onopen = (e) => console.log(`Socket ${i} openeed`);
    ws.onclose =(e) =>  console.log(`Socket ${i} closed ${e.reason}`);
}


export function securityMiddleware() {
    return async (req, res, next) => {
        if (!httpArcjet) return next();

        try {
            const decision = await httpArcjet.protect(req);

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'Too many request' })
                }
                return res.status(403).json({ error: 'Forbidden' })
            }
        } catch (e) {
            return res.status(503).json({ error: 'Service Unavailbale' })
        }
        next();
    }
}