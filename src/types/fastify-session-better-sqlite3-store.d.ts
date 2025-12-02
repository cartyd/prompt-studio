declare module 'fastify-session-better-sqlite3-store' {
  import { Database } from 'better-sqlite3';
  import { SessionStore } from '@fastify/session';

  class SqliteStore implements SessionStore {
    constructor(db: Database);
    set(sessionId: string, session: any, callback: (err?: Error) => void): void;
    get(sessionId: string, callback: (err: Error | null, session?: any) => void): void;
    destroy(sessionId: string, callback: (err?: Error) => void): void;
  }

  export = SqliteStore;
}
