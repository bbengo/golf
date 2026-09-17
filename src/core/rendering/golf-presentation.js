

/* Golf display policy. All physical data remains in metres. */
      const GolfPresentation = ((factory) => factory())(function () {
         'use strict';
         function distance(m, onGreen = false) { if (!Number.isFinite(m) || m < 0) throw Error('Invalid display distance'); const unit = onGreen ? 'ft' : 'yd', n = m / (onGreen ? .3048 : .9144), value = n === 0 ? '0' : n < .1 ? '<0.1' : (onGreen && n < 30) || n < 1 ? n.toFixed(1) : String(Math.round(n)); return { value, unit, text: value + ' ' + unit, unitLong: onGreen ? 'feet' : 'yards' }; }
         function restingBall(ball, last, phase) { return phase === 'resolved' && last ? last.result.finish : ball; }
         return { distance, restingBall };
      });

export { GolfPresentation };
