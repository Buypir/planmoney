export function getChartColors(isDark) {
  return isDark
    ? {
        grid: '#374151',
        tick: '#9ca3af',
        tooltipBg: '#1f2937',
        tooltipBorder: '#374151',
        tooltipText: '#f3f4f6',
        cursor: '#374151',
      }
    : {
        grid: '#f1f3f5',
        tick: '#868e96',
        tooltipBg: '#ffffff',
        tooltipBorder: '#e9ecef',
        tooltipText: '#1f2937',
        cursor: '#f8f9fa',
      };
}
