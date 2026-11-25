# PrepHelp API Specification

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/signup`
- **Body**: `{ name: string, email: string, password: string }`
- **Response**: `{ user: { id: string, name: string, email: string } }`
- **Cookies**: Sets `ph_token` (httpOnly, secure, SameSite=Lax).

### `POST /api/auth/login`
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: { id: string, name: string, email: string } }`
- **Cookies**: Sets `ph_token`.

### `POST /api/auth/logout`
- **Response**: `{ ok: true }`
- **Cookies**: Clears `ph_token`.

### `GET /api/auth/me`
- **Headers**: Cookie `ph_token`
- **Response**: `{ user: { id: string, name: string, email: string, consent: object } }`

---

## 2. Exercises Endpoints (`/api/exercises`)

### `GET /api/exercises`
- **Query**: `type?`, `targetSkills?`, `minDifficulty?`, `maxDifficulty?`
- **Response**: `{ exercises: Exercise[] }`

### `GET /api/exercises/:id`
- **Response**: `Exercise`

---

## 3. Sessions Endpoints (`/api/sessions`)

### `POST /api/sessions`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `exerciseId`: string
  - `mode`: `"voice"` | `"text"`
  - `audio`: File (if mode="voice", max 10MB)
  - `text`: string (if mode="text", min 10 chars)
- **Response**: `{ sessionId: string }`

### `GET /api/sessions/:id`
- **Response**: `Session` populated with `exerciseId`, `analysisId`, and associated `feedback`.

### `GET /api/sessions`
- **Response**: `Session[]` (history for current user).

---

## 4. ML Service Endpoints (`http://ml-service:8000`)

### `GET /health`
- **Response**: `{ status: "ok", service: "prephelp-ml", phase: 3 }`

### `POST /analyze/speech`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Audio File
  - `sessionId`: string (optional)
  - `referenceText`: string (optional)
- **Response**: `SpeechAnalysisResponse` (transcript, word timestamps, metrics, scores, flags, versions, warnings).

### `POST /analyze/text`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "transcript": "string",
    "exerciseType": "interview",
    "referenceText": "optional string",
    "targetSkills": ["grammar", "vocabulary"]
  }
  ```
- **Response**: `TextAnalysisResponse` (metrics, scores, errorPatterns, flags, versions, fallbackUsed).

### `POST /coach/feedback`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "analysis": { ... },
    "exercise": { ... }
  }
  ```
- **Response**:
  ```json
  {
    "summary": "string",
    "strengths": ["string", "string"],
    "improvements": ["string", "string"],
    "tip": "string"
  }
  ```
