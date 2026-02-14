import { Router } from 'express';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { db } from '../db/db.js';
import { getMatchStatus } from '../utils/matchUtils.js';
import { matches } from '../db/schema.js';
import { desc } from 'drizzle-orm';


export const matchRouter = Router();

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ error:   'Error!' }, parsed.error);
    }
    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT)

    try {
        let response = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit)
        res.status(200).json({ data: response })
    } catch (e) {
        res.status(500).json({ error: '', details: parsed.error.issues })
    }
    res.status(200).json({ data });
})

const MAX_LIMIT = 100;

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    console.log('parsed', parsed);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }

    const { startTime, endTime, homeScore, awayScore } = parsed.data;

    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(parsed.data.startTime),
            endTime: new Date(parsed.data.endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime)
        }).returning();

        if(res.app.locals.broadcastMatchCreated){
            res.app.locals.broadcastMatchCreated(event);
        }

        res.status(201).json({
            data: event
        })
    } catch (e) {
        res.status(500).json({
            error: 'Failed!', details: parsed.error.issues
        })
    }
})
