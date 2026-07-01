import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL ?? 'http://localhost:3000';

function extFromMime(mime?: string): string {
  if (mime?.includes('png')) return 'png';
  if (mime?.includes('webp')) return 'webp';
  return 'jpg';
}

/** Salva uma imagem base64 no diretório de uploads e retorna a URL pública. */
export function saveBase64Image(base64: string, mime?: string): string {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const filename = `${randomUUID()}.${extFromMime(mime)}`;
  writeFileSync(join(UPLOADS_DIR, filename), Buffer.from(clean, 'base64'));
  return `${PUBLIC_URL}/uploads/${filename}`;
}
