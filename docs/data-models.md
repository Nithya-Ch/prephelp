# PrepHelp Data Models

All primary schemas are persisted in MongoDB via Mongoose and validated using Zod.

## 1. User
- `email`: string (unique, lowercase, trimmed)
- `passwordHash`: string (bcrypt salt rounds = 10)
- `name`: string
- `createdAt`: Date
- `consent`:
  - `audioProcessing`: boolean
  - `retainAudio`: boolean
  - `timestamp`: Date

## 2. Exercise
- `id`: string (UUID or ObjectId)
- `type`: `"read-aloud"` | `"interview"` | `"description"` | `"written"` | `"retelling"`
- `prompt`: string
- `targetSkills`: string[]
- `difficulty`: number (0-100)
- `timeLimitSec`: number
- `prepTimeSec`: number
- `tags`: string[]
- `isActive`: boolean
- `source`: `"seed"` | `"llm"` | `"manual"`
- `reviewed`: boolean
- `referenceText`: string (optional, for read-aloud alignment)

## 3. Session
- `userId`: ObjectId (ref User)
- `exerciseId`: ObjectId (ref Exercise)
- `mode`: `"voice"` | `"text"`
- `audioPath`: string (optional)
- `text`: string (optional)
- `durationSec`: number (optional)
- `status`: `"queued"` | `"processing"` | `"complete"` | `"failed"`
- `errorCode`: string (optional)
- `analysisId`: ObjectId (ref Analysis)
- `recommendationId`: ObjectId (ref Recommendation)
- `createdAt`: Date

## 4. Analysis
- `sessionId`: ObjectId (ref Session, unique)
- `transcript`: string
- `words`: Array of `{ w: string, start: number, end: number, flag?: string }`
- `metrics`:
  - `wpm`, `articulation_wpm`, `pause_count`, `long_pause_count`, `pause_rate_per_min`, `pause_ratio`, `mean_length_of_run`
  - `filler_count`, `fillers_per_minute`
  - `pitch_mean`, `pitch_std`, `volume_mean`, `volume_std`
  - `errors_per_100_words`, `mtld`, `msttr`, `ttr`, `percent_b2_plus`, `cefr_distribution`
  - `hedging_count`, `repetition_count`, `sentence_completeness`
  - `word_accuracy`, `alignment_wer` (for read-aloud)
- `scores`:
  - `grammar`: 0-100 (null for audio-only metrics)
  - `vocabulary`: 0-100
  - `fluency`: 0-100 (null for text)
  - `pace`: 0-100 (null for text)
  - `filler_control`: 0-100 (null for text)
  - `structure`: 0-100
  - `confidence`: 0-100
- `flags`: Array of `{ type: string, start?: number, end?: number, detail?: string }`
- `llmUsed`: boolean
- `fallbackUsed`: boolean
- `versions`: `{ whisperModel, promptVersions, formulaVersion }`

## 5. Feedback
- `sessionId`: ObjectId (ref Session, unique)
- `summary`: string
- `strengths`: string[]
- `improvements`: string[]
- `tip`: string

## 6. LearnerProfile (Phase 4)
- Append-only snapshots tracking dimensions with score, uncertainty, trend, attempts, and errorPatterns.

## 7. Recommendation (Phase 5)
- Strategies: `"rule"` | `"weighted"` | `"bandit"` | `"random"` | `"fixed"` with human-readable explanation.
