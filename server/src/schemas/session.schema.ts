import { z } from "zod";

export const createSessionSchema = z.object({
  exerciseId: z.string().trim().min(1, "exerciseId is required"),
  mode: z.enum(["voice", "text"], {
    errorMap: () => ({ message: "mode must be either 'voice' or 'text'" }),
  }),
  text: z.string().optional(),
  // Additional context fields supported across exercises
  referenceText: z.string().optional(),
  exerciseType: z.string().optional(),
  exerciseTitle: z.string().optional(),
  questionText: z.string().optional(),
  questionId: z.string().optional(),
  questionCategory: z.string().optional(),
  topicId: z.string().optional(),
  wordId: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
