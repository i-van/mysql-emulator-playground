let trackingEnabled = false;

export const enableTracking = () => {
  trackingEnabled = true;
};

export const trackQuery = (sql) => {
  if (!trackingEnabled) {
    return;
  }
  window.gtag && window.gtag('event', 'query', { sql });
  window.mixpanel && window.mixpanel.track('query', { sql });
};

export const trackException = (err, sql) => {
  if (!trackingEnabled) {
    return;
  }
  window.gtag && window.gtag('event', 'exception', {
    description: `${err.message}; ${sql}`,
    fatal: false,
  });
  window.mixpanel && window.mixpanel.track('exception', {
    message: err.message,
    sql,
  });
};
