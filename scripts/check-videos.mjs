import { readFile } from 'node:fs/promises';

const TIMEOUT_MS = 20000;

const courseUrl = new URL('../src/content/course.json', import.meta.url);
const course = JSON.parse(await readFile(courseUrl, 'utf8'));

const urls = [
  ...new Set(
    course.units
      .flatMap((unit) => unit.lessons)
      .flatMap((lesson) => [lesson.videoUrl, lesson.fallbackUrl])
      .filter(Boolean),
  ),
];

async function getStatus(url) {
  try {
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-1023' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    await response.body?.cancel();
    return response.status;
  } catch (error) {
    return `failed (${error.cause?.code ?? error.name})`;
  }
}

const results = await Promise.all(urls.map(async (url) => ({ url, status: await getStatus(url) })));

for (const { url, status } of results) {
  console.log(`${status} ${url}`);
}

const dead = results.filter(({ status }) => status !== 200 && status !== 206);
console.log(`${results.length - dead.length}/${results.length} reachable`);
if (dead.length > 0) process.exit(1);
