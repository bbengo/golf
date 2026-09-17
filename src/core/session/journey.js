
const UCGJourney = ((factory) => factory())(function () {
         'use strict';
         const labels = Object.freeze(['Opening', 'Player profile', 'Course setup', 'Play']);
         function initial() { return { screen: 0, entered: false }; }
         function transition(state, action, valid = true) {
            if (!state || !Number.isInteger(state.screen) || state.screen < 0 || state.screen > 3) throw Error('Invalid screen state');
            const s = { ...state }; switch (action) {
               case 'profile': if (s.screen !== 0) return s; s.screen = 1; break;
               case 'setup': if (s.screen !== 1 || valid !== true) return s; s.screen = 2; break;
               case 'play': if (s.screen !== 2 || valid !== true) return s; s.screen = 3; s.entered = true; break;
               case 'back': if (s.screen === 2) s.screen = 1; else if (s.screen === 1) s.screen = 0; break;
               case 'edit-profile': if (s.screen === 3) s.screen = 1; break;
               case 'edit-setup': if (s.screen === 3) s.screen = 2; break;
               case 'cancel': if (s.entered && (s.screen === 1 || s.screen === 2)) s.screen = 3; break;
               default: throw Error('Unknown journey action');
            }
            return s;
         }
         return { VERSION: 'ucg50-journey/0.6.0', labels, initial, transition };
      });

export { UCGJourney };
