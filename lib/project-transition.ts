/**
 * Cinematic HUD transition overlay for project switching.
 *
 * Flow:
 * 1. showProjectTransition() creates the overlay + stores flag in sessionStorage
 * 2. window.location.href navigates (destroys current DOM)
 * 3. Inline <script> in layout.tsx runs BEFORE React hydrates, reads sessionStorage,
 *    re-creates the overlay instantly so the new page starts dark
 * 4. On window.load, the overlay fades out — seamless transition
 */

const OVERLAY_STYLES = `
  position: fixed; inset: 0; z-index: 99999;
  background: #08090a; display: flex; align-items: center;
  justify-content: center; flex-direction: column;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  overflow: hidden;
`;

const OVERLAY_INNER = `
  <style>
    @keyframes hud-spin { to { transform: rotate(360deg) } }
    @keyframes hud-scan {
      0% { top: 0%; opacity: 0 }
      10% { opacity: 1 }
      90% { opacity: 1 }
      100% { top: 100%; opacity: 0 }
    }
    @keyframes hud-expand-w { from { width: 0 } to { width: 100% } }
    @keyframes hud-expand-h { from { height: 0 } to { height: 100% } }
    @keyframes hud-flicker { 0%, 100% { opacity: 0.4 } 50% { opacity: 1 } }
    @keyframes hud-fill { from { width: 0% } to { width: 100% } }
    @keyframes hud-fadein { from { opacity: 0 } to { opacity: 1 } }
    .hud-readout { animation: hud-fadein 0.15s ease forwards; opacity: 0; }
  </style>

  <!-- Grid -->
  <div style="position:absolute;inset:0;opacity:0.03;background-image:linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px);background-size:60px 60px;"></div>

  <!-- Scan line -->
  <div style="position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(249,115,22,0.3),transparent);animation:hud-scan 1.2s linear;pointer-events:none;"></div>

  <!-- HUD border frame -->
  <div style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;pointer-events:none;">
    <div style="position:absolute;top:0;left:0;height:1px;background:linear-gradient(90deg,rgba(249,115,22,0.3),transparent);animation:hud-expand-w 0.6s ease-out 0.1s both;"></div>
    <div style="position:absolute;top:0;left:0;width:1px;background:linear-gradient(180deg,rgba(249,115,22,0.3),transparent);animation:hud-expand-h 0.6s ease-out 0.1s both;"></div>
    <div style="position:absolute;bottom:0;right:0;height:1px;background:linear-gradient(270deg,rgba(249,115,22,0.3),transparent);animation:hud-expand-w 0.6s ease-out 0.2s both;"></div>
    <div style="position:absolute;bottom:0;right:0;width:1px;background:linear-gradient(0deg,rgba(249,115,22,0.3),transparent);animation:hud-expand-h 0.6s ease-out 0.2s both;"></div>
  </div>

  <!-- Center content -->
  <div style="display:flex;flex-direction:column;align-items:center;gap:20px;z-index:1;">
    <div style="position:relative;width:56px;height:56px;">
      <svg width="56" height="56" viewBox="0 0 56 56" style="animation:hud-spin 2s linear infinite;opacity:0.2;">
        <circle cx="28" cy="28" r="25" fill="none" stroke="#f97316" stroke-width="0.5" stroke-dasharray="6 10"/>
      </svg>
      <svg width="56" height="56" viewBox="0 0 56 56" style="position:absolute;inset:0;animation:hud-spin 1.2s linear infinite;">
        <circle cx="28" cy="28" r="20" fill="none" stroke="#f97316" stroke-width="1" stroke-dasharray="20 100" stroke-linecap="round" opacity="0.6"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:6px;height:6px;border-radius:50%;background:#f97316;animation:hud-flicker 1s ease-in-out infinite;"></div>
      </div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(249,115,22,0.5);margin-bottom:8px;animation:hud-fadein 0.3s ease 0.3s both;">
        Initializing Project
      </div>
      <div id="hud-project-name" style="font-size:18px;font-weight:600;color:white;letter-spacing:0.05em;font-family:system-ui,-apple-system,sans-serif;animation:hud-fadein 0.3s ease 0.5s both;"></div>
    </div>
    <div style="display:flex;gap:24px;margin-top:8px;">
      <div class="hud-readout" style="animation-delay:0.6s;font-size:9px;color:#52525b;">
        <span style="color:rgba(249,115,22,0.5);">STATUS</span> CONNECTING
      </div>
      <div class="hud-readout" style="animation-delay:0.8s;font-size:9px;color:#52525b;">
        <span style="color:rgba(249,115,22,0.5);">AUTH</span> VERIFIED
      </div>
      <div class="hud-readout" style="animation-delay:1.0s;font-size:9px;color:#52525b;">
        <span style="color:rgba(249,115,22,0.5);">SYNC</span> IN PROGRESS
      </div>
    </div>
  </div>

  <!-- Progress bar -->
  <div style="position:absolute;bottom:48px;left:50%;transform:translateX(-50%);width:200px;animation:hud-fadein 0.3s ease 0.7s both;">
    <div style="height:1px;width:100%;background:#1a1a1a;border-radius:1px;overflow:hidden;">
      <div style="height:100%;background:linear-gradient(90deg,#f97316,#ea580c);animation:hud-fill 1.5s ease-in-out 0.8s both;"></div>
    </div>
    <div style="text-align:center;margin-top:8px;font-size:8px;text-transform:uppercase;letter-spacing:0.15em;color:#3f3f46;">
      Loading workspace
    </div>
  </div>
`;

function createOverlayElement(projectName: string, opacity = "1"): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "project-switch-overlay";
  overlay.style.cssText = OVERLAY_STYLES + `opacity: ${opacity};`;
  overlay.innerHTML = OVERLAY_INNER;
  const nameEl = overlay.querySelector("#hud-project-name");
  if (nameEl) nameEl.textContent = projectName;
  return overlay;
}

/**
 * Call before window.location.href navigation.
 * Shows overlay on current page + stores flag for the new page.
 */
export function showProjectTransition(projectName: string) {
  document.getElementById("project-switch-overlay")?.remove();

  // Store flag so the new page can recreate the overlay instantly
  try {
    sessionStorage.setItem("project-transition", projectName);
  } catch {
    // sessionStorage unavailable — overlay just won't persist, which is fine
  }

  const overlay = createOverlayElement(projectName, "0");
  document.body.appendChild(overlay);
  overlay.offsetHeight; // force reflow
  overlay.style.transition = "opacity 250ms ease";
  overlay.style.opacity = "1";
}

/**
 * Called by the inline boot script in layout.tsx.
 * Runs before React hydrates — checks sessionStorage and recreates overlay.
 */
export function bootTransitionCheck() {
  // This is inlined as a string in layout.tsx, not imported
}

/**
 * Inline script string for layout.tsx <script> tag.
 * Recreates the overlay on the NEW page before anything renders,
 * then fades it out once the page is fully loaded.
 */
export const BOOT_SCRIPT = `
(function() {
  var name;
  try { name = sessionStorage.getItem('project-transition'); } catch(e) {}
  if (!name) return;
  try { sessionStorage.removeItem('project-transition'); } catch(e) {}

  var o = document.createElement('div');
  o.id = 'project-switch-overlay';
  o.style.cssText = ${JSON.stringify(OVERLAY_STYLES)} + 'opacity:1;';
  o.innerHTML = ${JSON.stringify(OVERLAY_INNER)};
  var n = o.querySelector('#hud-project-name');
  if (n) n.textContent = name;
  document.body.appendChild(o);

  window.addEventListener('load', function() {
    setTimeout(function() {
      o.style.transition = 'opacity 400ms ease';
      o.style.opacity = '0';
      setTimeout(function() { o.remove(); }, 420);
    }, 300);
  });
})();
`;
