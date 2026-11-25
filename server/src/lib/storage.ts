import fs from "node:fs";
import path from "node:path";

/**
 * Returns the resolved directory path for file uploads.
 * Defaults to /app/uploads in containerized environments,
 * or local uploads/ directory in local development.
 */
export function getUploadDirectory(): string {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR;
  }
  if (fs.existsSync("/app")) {
    return "/app/uploads";
  }
  return path.resolve(process.cwd(), "uploads");
}

/**
 * Saves an uploaded file to the upload directory.
 *
 * @param file - Multer uploaded file object
 * @param filename - Target filename
 * @returns Full absolute path to the saved file
 */
export async function saveFile(
  file: Express.Multer.File,
  filename: string
): Promise<string> {
  const uploadDir = getUploadDirectory();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const destinationPath = path.join(uploadDir, filename);

  if (file.buffer) {
    await fs.promises.writeFile(destinationPath, file.buffer);
  } else if (file.path) {
    await fs.promises.copyFile(file.path, destinationPath);
  } else {
    throw new Error("No file content provided in Multer file object");
  }

  return destinationPath;
}

/**
 * Returns the full file path for a given filename in the uploads directory.
 *
 * @param filename - Name of the stored file
 * @returns Absolute path to file
 */
export function getFilePath(filename: string): string {
  return path.join(getUploadDirectory(), filename);
}
