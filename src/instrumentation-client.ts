type RouterNavigationType = 'push' | 'replace' | 'traverse';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function onRouterTransitionStart(
  url: string,
  navigationType: RouterNavigationType
) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const dataLayer = (window.dataLayer = window.dataLayer || []);
  dataLayer.push({
    event: 'router_transition_start',
    navigation_type: navigationType,
    destination: url,
  });
}
