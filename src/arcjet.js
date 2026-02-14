import arcjet from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if(!arcjetKey) throw new Error('Arcjet key is missing');

export const httpArcjet = arcjetKey ? 

arcjet({
    key: arcjetKey,
    rules: [
        shield({})
    ]
}) : null;

export const wsArcjet = arcjetKey ? 
arcjet({

}): null;