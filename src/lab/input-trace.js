

/* Bounded, local-only input evidence. No timers, network or automatic export. */
      const InputTrace = ((factory) => factory())(function () {
         'use strict';
         function create(limit = 512) {
            if (!Number.isInteger(limit) || limit < 32 || limit > 4096) throw Error('Invalid trace limit'); const rows = []; let serial = 0;
            function append(kind, detail = {}) { const row = { sequence: ++serial, kind, ...JSON.parse(JSON.stringify(detail)) }; rows.push(row); if (rows.length > limit) rows.shift(); return row; }
            return { append, read: () => JSON.parse(JSON.stringify(rows)), clear: () => { rows.length = 0; }, size: () => rows.length, limit };
         }
         return { VERSION: 'coursecraft-input-trace/0.4.4', create };
      });

export { InputTrace };
