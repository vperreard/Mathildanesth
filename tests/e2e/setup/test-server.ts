import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'http';

let server: Server | null = null;
let app: any = null;

export async function startTestServer(port = 3001): Promise<string> {
  if (server) {
    return `http://localhost:${port}`;
  }

  // Configuration Next.js pour les tests
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_URL = `http://localhost:${port}`;
  process.env.NEXTAUTH_SECRET = 'test-secret-for-e2e-tests';
  
  app = next({
    dev: false,
    dir: process.cwd(),
    quiet: true
  });

  await app.prepare();

  const handle = app.getRequestHandler();

  return new Promise((resolve, reject) => {
    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    server.listen(port, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        console.log(`> Test server ready on http://localhost:${port}`);
        resolve(`http://localhost:${port}`);
      }
    });
  });
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise((resolve) => {
      server!.close(resolve as any);
    });
    server = null;
  }
  
  if (app) {
    await app.close();
    app = null;
  }
}