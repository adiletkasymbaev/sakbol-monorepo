export function bindZoneTooltip(layer: L.Polygon, title: string, start: string, end: string) {
  layer.bindTooltip(
    `
    <div class="zone-label-inner">
      <strong>${title}</strong><br/>
      ${start} – ${end}
    </div>
    `,
    {
      permanent: true,
      direction: "center",
      className: "zone-label",
      opacity: 1,
    }
  );
}