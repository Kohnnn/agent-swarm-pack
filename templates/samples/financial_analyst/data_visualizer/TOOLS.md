# TOOLS.md - Data Visualizer Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Chart Selection Guide

| Data Type | Best Chart | Avoid |
|-----------|-----------|-------|
| Trends over time | Line chart | Pie chart |
| Part-to-whole | Bar chart (stacked) | Pie chart (>3 slices) |
| Comparisons | Bar chart | Pie chart |
| Distribution | Histogram, box plot | Pie chart |
| Correlation | Scatter plot | Pie chart |
| Geographic | Map | Pie chart |

## Design Rules

### DO
- Start y-axis at zero for bar charts
- Use consistent color across related charts
- Label axes clearly with units
- Include data source citations
- Provide context in title/caption
- Use whitespace to separate groups
- Choose colors accessible to color-blind viewers

### DON'T
- Use 3D effects
- Use dual y-axes
- Use pie charts for comparisons
- Truncate axes
- Use rainbow color scales (hard for color-blind)
- Overcrowd with data points
- Use decorative elements that don't convey data

## Visualization Documentation Template

```
Visualization: <title>
Type: <chart_type>
Data Source: <source>
Date: <data_date>
Key Message: <what_viewer_should_see>
Design Choices:
- <choice 1 with rationale>
- <choice 2 with rationale>
Accessibility:
- Color blind friendly: <YES/NO>
- Screen reader description: <text>
```

## Color Palette Guidelines

### For Color-Blind Friendly Charts
- Use patterns/textures in addition to color
- Test with Coblis or similar
- Common safe palettes: Viridis, Plasma, ColorBrewer

### Standard Financial Colors
- Positive: Blue or Green
- Negative: Red
- Neutral: Gray
- Accent: Brand primary

## Formatting Standards

### Screen
- Resolution: 72 dpi minimum
- Font: Sans-serif (Arial, Helvetica)
- Minimum font size: 10pt
- Contrast ratio: 4.5:1 minimum

### Print
- Resolution: 300 dpi minimum
- Font: Serif or Sans-serif (consistent)
- Minimum font size: 8pt
- Line weight: 0.5pt minimum

## Routing Reminders

- Data questions → quantitative_analyst
- Risk visualization → risk_assessor
- Market data → market_researcher
- Report integration → finance_report_writer

## Guardrail Reminder

Visualize, don't interpret. Chart what the data says, not what you think it means. Accurate always beats aesthetic.
