import { Router } from 'express';
import { matchIdParamSchema } from '../validation/matches.js';
import { commentary } from '../db/schema.js';
import { createCommentrySchema, listMatchesQuerySchema } from '../validation/commentry.js';
import { desc } from 'drizzle-orm';

export const commentaryRouter = Router();

commentaryRouter.get('/', async (res, req) => {

    const paramRes = matchIdParamSchema.safeParse(req.params);

    if (!paramRes.success) {
        return res.status(400).json({ error: paramRes.error.issues });
    }
    const bodyRes = listMatchesQuerySchema.safeParse(req.query);
    let { id: matchId } = paramRes.data;
    let { limit = 10 } = bodyRes.data;
    if (!bodyRes.success) {
        return res.status(400).json({ error: bodyRes.error.issues });
    }

    try {
        const response = await db.select().from(commentary).where(eq(commentary.matchId, matchId)).orderBy(desc(commentary.createdAt)).limit(limit);
        res.status(200).json({ data: response })
    } catch (e) {
        res.status(500).json({ error: bodyRes.error.issues })
    }

    res.status(200).json({ message: 'Commentary List' })
})

commentaryRouter.post('/', async (req, res) => {
    const paramRes = matchIdParamSchema.safeParse(req.params);

    console.log('paramRes', paramRes,req.params, typeof req.params);

    if (!paramRes.success) {
        console.log('parama issues', paramRes.error.issues)
        return res.status(400).json({ error: paramRes.error.issues });
    }

    const bodyRes = createCommentrySchema.safeParse(req.body);

    if (!bodyRes.success) {
        return res.status(400).json({ error: 'Invalid commentary payload.', details: bodyRes.error.issues });
    }

    const { minutes, ...rest } = bodyRes.data;

    try {
        const [event] = await db.insert(commentary).values({
            matchId: paramRes.data.id,
            minutes,
            ...rest
        }).returning();

        // if (res.app.locals.broadcastMatchCreated) {
        //     res.app.locals.broadcastMatchCreated(event.matchId, event);
        // }

        res.status(201).json({
            data: event
        })
    } catch (e) {
        res.status(500).json({
            error: 'Failed!'
        })
    }
})
