// Property video link rules — same link shapes the server and website accept
// (reparv-server src/core/utils/videoLinks.js, reparv-website src/utils/videoLinks.js).

export const YOUTUBE_REGEX =
  /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&#/].*)?$/i;

export const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(?:reel|reels|p|tv)\/([\w-]+)\/?(?:[?#].*)?$/i;

export const youtubeIdOf = link =>
  String(link || '')
    .trim()
    .match(YOUTUBE_REGEX)?.[1] || '';

export const reelCodeOf = link =>
  String(link || '')
    .trim()
    .match(INSTAGRAM_REEL_REGEX)?.[1] || '';

/** { videoLink?, instagramReelLink? } error messages for invalid (non-empty) links */
export const validateVideoLinks = ({videoLink, instagramReelLink}) => {
  const errors = {};
  const yt = String(videoLink || '').trim();
  const ig = String(instagramReelLink || '').trim();
  if (yt && !YOUTUBE_REGEX.test(yt)) {
    errors.videoLink = 'Enter a valid YouTube link (watch, shorts or youtu.be)';
  }
  if (ig && !INSTAGRAM_REEL_REGEX.test(ig)) {
    errors.instagramReelLink = 'Enter a valid Instagram reel link';
  }
  return errors;
};
