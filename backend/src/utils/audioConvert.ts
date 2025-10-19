// Import with require fallback for environments without types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg = require('fluent-ffmpeg');
import path from 'path';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegStatic = require('ffmpeg-static') as string | null;

// Wire ffmpeg binary path (works cross-platform)
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

/**
 * Convert an audio file to MP3. If already MP3, returns the original path.
 * - Downmix to mono and set sample rate to 44.1kHz for ASR compatibility.
 */
export const convertToMp3 = async (srcPath: string): Promise<{ mp3Path: string; removedSrc: boolean }> => {
  const ext = path.extname(srcPath).toLowerCase();
  if (ext === '.mp3') {
    return { mp3Path: srcPath, removedSrc: false };
  }
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, ext);
  const outPath = path.join(dir, `${base}.mp3`);

  // If output already exists, reuse it
  if (fs.existsSync(outPath)) {
    return { mp3Path: outPath, removedSrc: false };
  }

  await new Promise<void>((resolve, reject) => {
    ffmpeg(srcPath)
      .audioCodec('libmp3lame')
      .audioChannels(1)
      .audioFrequency(44100)
      .format('mp3')
      .on('end', () => resolve())
  .on('error', (err: unknown) => reject(err))
      .save(outPath);
  });

  // Optionally remove original non-mp3 file to save space
  let removed = false;
  try {
    if (ext !== '.mp3' && fs.existsSync(srcPath)) {
      fs.unlinkSync(srcPath);
      removed = true;
    }
  } catch {}

  return { mp3Path: outPath, removedSrc: removed };
};
