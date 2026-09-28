// Prevent the legacy mockup renderer from creating a self-triggering MutationObserver loop.
// mockup-ui.js already renders on DOMContentLoaded, season-ready, and via the shared render hook.
(()=>{window.__REDRAFT_NATIVE_MUTATION_OBSERVER=window.MutationObserver;class OneShotObserver{constructor(cb){this.cb=cb}observe(){/* intentionally no continuous DOM observation */}disconnect(){}takeRecords(){return[]}}window.MutationObserver=OneShotObserver})();
