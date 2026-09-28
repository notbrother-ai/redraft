// Restore the browser MutationObserver immediately after mockup-ui.js has initialized.
(()=>{if(window.__REDRAFT_NATIVE_MUTATION_OBSERVER){window.MutationObserver=window.__REDRAFT_NATIVE_MUTATION_OBSERVER;delete window.__REDRAFT_NATIVE_MUTATION_OBSERVER}})();
