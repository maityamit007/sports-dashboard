import { z } from 'zod';

export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional()
})

export const createCommentrySchema = z.object({
    minute: z.number().int().nonnegative(),
    sequence: z.number().optional(1),
    period: z.string().optional(1),
    eventType: z.string().optional(1),
    actor: z.string().optional(1),
    team: z.string().min(1),
    message: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional()
})
