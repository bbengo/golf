# Course presentation

The visual proof of concept is deliberately restrained. `simple-course.ts` draws
authored polygons with surface colours, mowing bands, coarse smoothed illumination
from the physical slope field, basic circular tree canopies and a bridge. It loads
no image assets. Tree geometry comes from actual course objects; visual decoration
does not silently add colliders or change material properties.

The static background is cached by camera/course setup. Each frame draws only
the cached ground and changing ball/cup/intent overlays. Camera framing uses the
authored course presentation bounds, with phone-controlled ball/green close-ups.
Course coordinates remain unchanged by zoom. Phone touchpad axes match the fixed
overhead orientation.

The launch indicator uses the deterministic launch velocity, with a small symbolic
curve cue for the requested shape. It is not a predicted landing point or a shot
optimiser. Ball animation comes from the actual simulated trajectory, displayed
at three times simulation speed. Cosmetic ball lift helps distinguish flight.

The photographic renderer is loaded dynamically only when selected on the phone.
Its images are local files extracted from the original reference HTML. Switching
appearance does not switch course or engine. `plate-renderer.js` is an older
retained compositor, which expects supporting asset metadata and is not the active
image-free renderer.

No photorealistic grass, full 3D world, cinematic lighting or elaborate vegetation
is required to judge this interaction. Readability, stable camera behaviour and
agreement between visible ground and physical geometry take priority.
