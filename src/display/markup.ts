export const displayMarkup = `
<canvas id="course" tabindex="0" aria-label="Golf course. Drag to explore, scroll to zoom, Shift-drag to rotate."></canvas>
<section id="portal" aria-label="Game menus">
 <section class="title-screen" data-page="title">
  <svg class="purity-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M17 51V13c15-10 20 13 34 3v23c-14 10-19-13-34-3" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><circle cx="43" cy="52" r="5" fill="currentColor"/></svg><p class="title-kicker">A LITTLE ROOM TO PLAY</p>
  <h1>purity</h1><p class="title-subtitle">THE GOLF EXPERIMENT</p>
  <a href="#editions" class="begin-button">Enter the course <span aria-hidden="true">↗</span></a>
  <p class="title-location">CREEK & SHOULDER <span>01 / WOODLAND</span></p>
 </section>
 <section class="edition-screen" data-page="editions" hidden aria-labelledby="editionTitle">
  <header><a class="back-link" href="#title">← Back to title</a><p class="eyebrow">TWO WAYS INTO THE GAME</p><h1 id="editionTitle">Choose your experience.</h1></header>
  <div class="edition-grid">
   <a class="edition-card edition-purity" href="#home" aria-label="Choose Purity">
    <span class="edition-label">01 / THE NEXT CHAPTER</span><h2>Purity</h2><p>The course takes the whole screen. Keep your controls here, or move them to your phone.</p>
    <div class="edition-emblem" aria-hidden="true">p<span>↗</span></div>
    <dl><div><dt>Play</dt><dd>Desktop or paired phone</dd></div><div><dt>Course</dt><dd>Woodland practice</dd></div><div><dt>Physics</dt><dd>Experimental fundamentals</dd></div></dl><span class="edition-enter">Enter Purity <b aria-hidden="true">↗</b></span>
   </a>
   <a class="edition-card edition-original" href="/?mode=lab" aria-label="Choose UCG-50 Original">
    <span class="edition-label">02 / THE ORIGINAL EXPERIENCE</span><h2>UCG-50<span>Original</span></h2><p>The full original desktop experience, with its player setup, course tools and original simulation.</p>
    <div class="edition-emblem" aria-hidden="true">50<span>°</span></div>
    <dl><div><dt>Play</dt><dd>Original desktop controls</dd></div><div><dt>Course</dt><dd>Original course study</dd></div><div><dt>Physics</dt><dd>Original UCG-50 model</dd></div></dl><span class="edition-enter">Enter UCG-50 <b aria-hidden="true">↗</b></span>
   </a>
  </div><p class="edition-note">Opening UCG-50 leaves your current Purity round. You can return to this selection from the original experience.</p>
 </section>
 <section class="game-lobby" data-page="home" hidden>
  <header class="game-heading"><a href="#title" class="game-wordmark" aria-label="Return to title"><svg class="purity-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M17 51V13c15-10 20 13 34 3v23c-14 10-19-13-34-3" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><circle cx="43" cy="52" r="5" fill="currentColor"/></svg>purity</a><span>YOUR PRACTICE GROUND</span></header>
  <div class="lobby-body"><p class="eyebrow">CREEK & SHOULDER / 01</p><h1>Find your<br>own rhythm.</h1>
   <nav class="game-actions" aria-label="Game menu">
    <a href="#play" data-open-controls class="selected-action"><span id="enterRoundLabel">Play</span><small>Controls on this screen</small><b aria-hidden="true">↗</b></a>
    <button id="lobbyOptions"><span>Game options</span><small>Your interface, phone pairing & conditions</small></button>
    <a href="#editions"><span>Choose experience</span><small>Purity / UCG-50 Original</small></a>
   </nav>
  </div>
  <footer class="game-footer"><a href="#story">About Purity</a><button id="fullscreenButton">Full screen ↗</button><a href="#title">Title screen</a><span id="screenStatus" role="status"></span></footer>
  <div class="world-caption" aria-hidden="true"><span>01</span><p>Creek & Shoulder<small>Woodland practice · Three tees · Your pace</small></p></div>
 </section>
 <section class="game-panel" data-page="course" hidden aria-labelledby="courseTitle">
  <header><a class="back-link" href="#home">← Back</a><span class="eyebrow">PRACTICE GROUND / 01</span></header>
  <div class="panel-scroll"><p class="eyebrow">WOODLAND</p><h1 id="courseTitle">Creek &<br>Shoulder</h1><p class="panel-lead">Follow the creek. Read the shoulder. Find your line.</p>
   <dl class="course-facts"><div><dt>Format</dt><dd>Single-hole practice</dd></div><div><dt>Starting points</dt><dd>Three tees</dd></div><div><dt>The green</dt><dd>Three pin positions</dd></div><div><dt>Conditions</dt><dd>Adjustable wind & ground</dd></div></dl>
   <p>The woodland frames a narrow fairway, with sand guarding the approach and a raised green that rewards a considered landing.</p><p>Choose your club and conditions from the controls. Change your approach, take a mulligan, and play at your own pace.</p>
  </div><footer><a class="primary" href="#play" data-open-controls>Play this course ↗</a><a href="#pair">Use my phone</a></footer>
 </section>
 <section class="game-panel" data-page="guide" hidden aria-labelledby="guideTitle">
  <header><a class="back-link" href="#home">← Back</a><span class="eyebrow">FIELD GUIDE</span></header>
  <div class="panel-scroll"><h1 id="guideTitle">Make it<br>your game.</h1><div class="guide-cards">
   <article><span>01 / GET COMFORTABLE</span><h2>Choose your controls.</h2><p>Choose Desktop controls, Minimal HUD or Clear course in Game options. Connect a phone on the same Wi-Fi whenever you want touch controls.</p></article>
   <article><span>02 / FIND YOUR LINE</span><h2>Read. Aim. Commit.</h2><p>On desktop, click the course to aim and use the shot dock to choose your club and effort. On your phone, use the aim pad and My bag. Shape & flight gives you finer control on either screen.</p></article>
   <article><span>03 / PLAY IT THROUGH</span><h2>Let the ball travel.</h2><p>Play your shot, then continue from the result or take a mulligan. Your selected interface stays available. Camera following is optional in Game options.</p></article>
   <article><span>YOUR VIEW</span><h2>Look around.</h2><p>Drag to pan. Scroll to zoom. Shift-drag or right-drag to rotate. Double-click to see the hole. N restores north; Escape opens the menu. On the phone, Round takes you to the ball or green.</p></article>
  </div></div><footer><a class="primary" href="#play" data-open-controls>Try a shot ↗</a><a href="#pair">Connect a phone</a></footer>
 </section>
 <section class="game-panel" data-page="story" hidden aria-labelledby="storyTitle">
  <header><a class="back-link" href="#home">← Back</a><span class="eyebrow">ABOUT PURITY</span></header>
  <div class="panel-scroll"><h1 id="storyTitle">A course<br>without a frame.</h1><p class="panel-lead">One world. Two ways to play.</p><p>Purity began with UCG-50: a golf simulation inside a single HTML file. This is its next practice ground. The course fills your screen, while each decision belongs in your hand.</p><p>Play with the controls here or move them to your phone. The same simulation responds to every shot.</p><h2>The original experiment</h2><p>The original UCG-50 lab remains available separately. Opening it leaves your current in-memory round.</p><a class="secondary" href="/?mode=lab">Open original lab ↗</a></div>
  <footer><a href="#home">Return to game menu</a></footer>
 </section>
</section>
<div id="menuShade" class="menu-shade" hidden></div>
<nav id="displayTools" class="display-tools" aria-label="Game menu" hidden><p class="hud-eyebrow">PURITY / IN THE ROUND</p><h2>Game menu</h2><button id="quietView" class="resume-action">Resume game</button><button id="openGameOptions">Game options</button><a href="#guide">How to play</a><a href="#editions">Choose experience</a><a href="#home" aria-label="Return to main menu">Main menu</a></nav>
<dialog id="gameOptions" class="game-options" aria-labelledby="optionsTitle"></dialog>
<button id="revealTools" class="reveal-tools" aria-label="Open course menu" aria-controls="displayTools" aria-expanded="false" title="Course menu (Escape)" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 16h14"/></svg></button>
<section id="desktopControls" class="desktop-hud" aria-label="Desktop shot controls" hidden></section>
<dialog id="pairing" class="pairing" aria-labelledby="pairingTitle"><header><a class="back-link" href="#play">← Back to course</a><button id="closePairing" class="icon-button" aria-label="Close pairing">×</button></header><p class="eyebrow">ONE COURSE. TWO SCREENS.</p><h1 id="pairingTitle">A little space<br>between you &<br><em>the controls.</em></h1><p>Scan with your phone. Keep both devices on the same Wi-Fi.</p><canvas id="qr" aria-label="Pairing QR code"></canvas><a id="cockpitLink" role="button">Copy phone pairing link ↗</a><input id="pairUrl" aria-label="Phone pairing link" readonly hidden><label id="networkLabel" hidden>Wi-Fi address<select id="network"></select></label><p id="pairStatus" role="status">Preparing your connection…</p><button id="playHere" class="secondary">Use controls on this screen instead</button></dialog>`;
