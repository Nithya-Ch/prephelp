# PrepHelp Privacy and Security Specification

## 1. Principles
- Audio recordings and speech transcripts are sensitive personal biometric/behavioral data.
- PrepHelp adheres to explicit user consent, minimal data retention, transparent metrics, and user-initiated data deletion.

## 2. Consent Controls
- Users provide explicit consent during signup:
  - `audioProcessing`: Consent to convert, transcribe, and analyze voice audio.
  - `retainAudio`: Optional consent to retain audio for future replay. If false, audio is purged immediately post-analysis.
- Consent state is recorded with a timestamp on the `User` document.

## 3. Data Retention & Storage Policy
- **Audio Files**: Stored with non-guessable UUIDs in isolated `/app/uploads` volume. Default retention is configurable (`AUDIO_RETENTION_DAYS`). If user opted out of retention, audio is deleted after analysis.
- **Transcripts & Metrics**: Associated strictly with the authenticated `userId`.
- **Logs**: Strict redacting: audio contents, raw speech bytes, and JWT tokens are NEVER written to logs.

## 4. Threat Model & Prompt Injection Safeguards
- **Untrusted Transcripts**: Transcripts and user written answers are treated as untrusted data.
- **LLM Boundary Protection**: In any LLM rubric or coaching prompt, candidate text is isolated within strict delimiters (e.g. `<student_transcript>...</student_transcript>`) with explicit system instructions prohibiting execution of any embedded commands.
- **API Keys**: Stored exclusively in server/ML service environment variables, never accessible to the client.

## 5. Right to Erasure
- In Phase 6, the `/api/user/delete-data` endpoint permanently removes all associated audio files, transcripts, metrics, and profile snapshots.
