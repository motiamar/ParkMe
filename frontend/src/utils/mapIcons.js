import L from 'leaflet';

// Green "P" pin for each parking lot on the map.
// divIcon avoids the Leaflet + Vite default-icon asset-path bug.
// iconAnchor [13, 34] places the triangle tip on the exact coordinate.
export const parkingIcon = L.divIcon({
  className: '',
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
           <div style="width:26px;height:26px;background:#16a34a;border:3px solid #fff;
                       border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);
                       display:flex;align-items:center;justify-content:center;
                       font-family:sans-serif;font-weight:800;font-size:13px;color:#fff;">P</div>
           <div style="width:0;height:0;border-left:6px solid transparent;
                       border-right:6px solid transparent;border-top:8px solid #16a34a;"></div>
         </div>`,
  iconSize:    [26, 34],
  iconAnchor:  [13, 34],
  popupAnchor: [0, -36],
});

// Classic teardrop pin shown at the geocoded search result.
// iconAnchor [16, 42] places the very tip of the pin on the exact coordinate.
export const searchLocationIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
           <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26S32 26.5 32 16C32 7.163 24.837 0 16 0z"
                 fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
           <circle cx="16" cy="15" r="7" fill="#ffffff"/>
         </svg>`,
  iconSize:    [32, 42],
  iconAnchor:  [16, 42],
  popupAnchor: [0, -44],
});
