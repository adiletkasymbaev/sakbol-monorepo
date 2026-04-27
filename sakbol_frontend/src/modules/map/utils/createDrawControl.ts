import L from "leaflet";

// Custom SVG icons for the draw controls
const POLYGON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l-9.53 6.82 3.64 11.18h11.78l3.64-11.18z"/></svg>`;

const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

const DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

export function createDrawControl(color: string, featureGroup: L.FeatureGroup) {
  // Create the draw control with custom options
  const drawControl = new L.Control.Draw({
    position: "topright",
    draw: {
      marker: false,
      circle: false,
      circlemarker: false,
      rectangle: false,
      polyline: false,
      polygon: {
        allowIntersection: false,
        drawError: { color: "#ef4444", message: "Нельзя пересекать линии!" },
        shapeOptions: {
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 3,
        },
      },
    },
    edit: { 
      featureGroup,
      edit: {
        selectedPathOptions: {
          color: "#274193",
          fillColor: "#274193",
          fillOpacity: 0.4,
          weight: 4,
        }
      }
    },
  });

  // Override the default toolbar to use custom icons
  const originalOnAdd = drawControl.onAdd;
  drawControl.onAdd = function(map: L.Map) {
    const container = originalOnAdd.call(this, map);
    
    // Style the container
    const toolbar = container.querySelector('.leaflet-draw-toolbar') as HTMLElement;
    if (toolbar) {
      toolbar.style.border = 'none';
      toolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      toolbar.style.borderRadius = '12px';
      toolbar.style.overflow = 'hidden';
      toolbar.style.backgroundColor = 'white';
    }

    // Style all toolbar links (buttons)
    const links = container.querySelectorAll('.leaflet-draw-toolbar a');
    links.forEach((link) => {
      const el = link as HTMLElement;
      el.style.backgroundColor = 'white';
      el.style.border = 'none';
      el.style.borderBottom = '1px solid #e5e7eb';
      el.style.width = '42px';
      el.style.height = '42px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.transition = 'all 0.2s ease';
      el.style.color = '#6b7280';
      
      // Remove default background image
      el.style.backgroundImage = 'none';
      
      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.backgroundColor = '#f3f4f6';
        el.style.color = '#274193';
      });
      el.addEventListener('mouseleave', () => {
        if (!el.classList.contains('leaflet-draw-toolbar-button-enabled')) {
          el.style.backgroundColor = 'white';
          el.style.color = '#6b7280';
        }
      });
    });

    // Add custom icons to buttons
    const polygonBtn = container.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
    if (polygonBtn) {
      polygonBtn.innerHTML = POLYGON_ICON;
      polygonBtn.title = 'Нарисовать зону';
    }

    const editBtn = container.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
    if (editBtn) {
      editBtn.innerHTML = EDIT_ICON;
      editBtn.title = 'Редактировать зоны';
    }

    const deleteBtn = container.querySelector('.leaflet-draw-edit-remove') as HTMLElement;
    if (deleteBtn) {
      deleteBtn.innerHTML = DELETE_ICON;
      deleteBtn.title = 'Удалить зоны';
      deleteBtn.style.borderBottom = 'none';
    }

    // Style enabled/active state
    const styleEnabled = () => {
      const enabled = container.querySelectorAll('.leaflet-draw-toolbar-button-enabled');
      enabled.forEach((btn) => {
        const el = btn as HTMLElement;
        el.style.backgroundColor = '#274193';
        el.style.color = 'white';
      });
    };

    // Watch for class changes
    const observer = new MutationObserver(styleEnabled);
    links.forEach((link) => {
      observer.observe(link, { attributes: true, attributeFilter: ['class'] });
    });

    return container;
  };

  return drawControl;
}
