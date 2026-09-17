import { Course } from '../core/course/course.js';

/* Course Play R0.4.4. Overlay visibility is not an input mode.
* Pure presentation state and primary-pointer classification; no physics,
* target selection, weather, golfer or record mutation belongs here.
*/
      const MapInput = ((factory) => factory())(function () {
         'use strict';
         const DRAG_THRESHOLD = 9, TOUCH_THRESHOLD = 14, TARGET_HIT_RADIUS = 22;
         function transition(state, action) {
            const next = { terrainOn: !!state.terrainOn, mapMode: state.mapMode === 'inspect' ? 'inspect' : 'aim' };
            switch (action.type) {
               case 'overlay': next.terrainOn = !!action.visible; if (!next.terrainOn) next.mapMode = 'aim'; break;
               case 'mode':
                  if (!['aim', 'inspect'].includes(action.mode)) throw Error('Unknown map input mode');
                  next.mapMode = action.mode; if (next.mapMode === 'inspect') next.terrainOn = true; break;
               case 'new-shot': next.mapMode = 'aim'; break;
               default: throw Error('Unknown map input action');
            }
            if (!next.terrainOn) next.mapMode = 'aim';
            return next;
         }
         function begin(event, camera, options) {
            if (event.isPrimary === false || event.button !== 0 || !Number.isFinite(event.pointerId) || ![event.clientX, event.clientY, camera.x, camera.y].every(Number.isFinite)) return null;
            const g = { pointer: event.pointerId, x: event.clientX, y: event.clientY, cx: camera.x, cy: camera.y, moveDist: 0 };
            if (options) { g.owner = options.targetHit ? 'target' : 'background'; g.threshold = event.pointerType === 'touch' ? TOUCH_THRESHOLD : DRAG_THRESHOLD; g.pointerType = event.pointerType || 'mouse'; }
            return g;
         }
         function move(gesture, event) {
            if (!gesture || event.pointerId !== gesture.pointer || ![event.clientX, event.clientY].every(Number.isFinite)) return gesture;
            return { ...gesture, moveDist: Math.max(gesture.moveDist, Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y)) };
         }
         function finish(gesture, event) {
            if (!gesture || event.pointerId !== gesture.pointer || ![event.clientX, event.clientY].every(Number.isFinite)) return { kind: 'ignore' };
            const ended = move(gesture, event);
            return { kind: ended.moveDist > (ended.threshold ?? DRAG_THRESHOLD) ? (ended.owner === 'target' ? 'target-drag' : 'pan') : 'tap', pointer: ended.pointer };
         }
         return { DRAG_THRESHOLD, TOUCH_THRESHOLD, TARGET_HIT_RADIUS, transition, begin, move, finish };
      });

export { MapInput };
