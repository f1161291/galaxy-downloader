'use client';

import { useReportWebVitals } from 'next/web-vitals';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const dataLayer = (window.dataLayer = window.dataLayer || []);
    dataLayer.push({
      event: 'web_vitals',
      metric_id: metric.id,
      metric_name: metric.name,
      metric_label: metric.label,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      metric_navigation_type: metric.navigationType,
    });
  });

  return null;
}
