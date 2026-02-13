# Sobrecupo Redesign - Implementation Guide

## Completed (Phase 1-2)
✅ Core data structures (building priority, restricted rooms)
✅ 8A/8B cycle detection
✅ Building page redesign (removed search, colors, progress bars)
✅ FloatingMailbox removed, GitHub links added
✅ Default route changed to /buildings
✅ Human-friendly day names ("Lunes" instead of "L")

## Remaining Work

### Phase 3: Classrooms Page Redesign

#### 3.1 Organize by Floor
```javascript
// In Classrooms.js, group rooms by floor
const groupByFloor = (rooms) => {
  const floors = {};
  rooms.forEach(room => {
    const floor = room.room.split(' ')[1]?.charAt(0) || '0';
    if (!floors[floor]) floors[floor] = [];
    floors[floor].push(room);
  });
  return floors;
};
```

#### 3.2 Handle Merged Rooms (e.g., "AU 103-4")
```javascript
// When parsing classroom names, detect merged rooms
const parseMergedRoom = (roomName) => {
  if (roomName.includes('-')) {
    const [start, end] = roomName.split('-');
    return {
      isMerged: true,
      rooms: [start, start.slice(0, -1) + end],
      display: roomName
    };
  }
  return { isMerged: false, display: roomName };
};
```

#### 3.3 Apply Restricted Rooms
```javascript
// Mark restricted rooms visually
<article className={`classroom-card ${room.restricted ? 'restricted' : ''} ...`}>
  {room.restricted && (
    <div className="restriction-badge">
      <span>⚠️ Acceso Restringido</span>
    </div>
  )}
</article>
```

#### 3.4 Better Copy
Replace:
- "Me ocupo a las" → "Disponible hasta las" / "Próxima clase a las"
- "Me desocupo a las" → "Ocupado hasta las" / "Libre a las"

### Phase 4: Time Selection Redesign

#### 4.1 Move to Configuration Modal
Create `TimeConfig.js`:
```javascript
const TimeConfig = ({ isOpen, onClose, day, time, onUpdate }) => {
  const quickTimes = ['06:30', '08:00', '09:30', '11:00', '12:30', '14:00', 
                      '15:30', '17:00', '18:30', '20:00'];
  
  return (
    <div className={`time-config-modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>Seleccionar Horario</h2>
        
        <div className="day-selector-grid">
          {dayNames.map((name, idx) => (
            <button 
              key={idx}
              className={`day-button ${day === days[idx].toUpperCase() ? 'active' : ''}`}
              onClick={() => onUpdate(days[idx].toUpperCase(), time)}
            >
              {name}
            </button>
          ))}
        </div>
        
        <div className="quick-times">
          <h3>Horas comunes de clase</h3>
          <div className="time-grid">
            {quickTimes.map(t => (
              <button 
                key={t}
                onClick={() => onUpdate(day, t)}
                className="time-button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <input type="time" value={time} onChange={(e) => onUpdate(day, e.target.value)} />
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};
```

#### 4.2 Auto-Update Current Time
```javascript
// In Buildings.js
const [autoUpdate, setAutoUpdate] = useState(true);
const [manualOverride, setManualOverride] = useState(false);

useEffect(() => {
  if (!autoUpdate || manualOverride) return;
  
  const interval = setInterval(() => {
    now(); // Update to current time
  }, 60000); // Every minute
  
  return () => clearInterval(interval);
}, [autoUpdate, manualOverride]);

const handleManualTimeChange = (newTime) => {
  setManualOverride(true);
  setTime(newTime);
  // Disable manual override after 1 hour
  setTimeout(() => setManualOverride(false), 3600000);
};
```

### Phase 5: Calendar View Fixes

#### 5.1 Fix Time Alignment
The issue is in `timeUtils.js`:
```javascript
// Current (incorrect):
export function tiempoAPixeles(tiempo) {
  return ((tiempo - 600) / 1500) * 750 + 18;
}

// Fixed:
export function tiempoAPixeles(tiempo) {
  // Map 600-2100 (15 hours) to 750px height
  // Each hour = 50px
  const minutes = Math.floor(tiempo / 100) * 60 + (tiempo % 100);
  const minutesFrom6am = minutes - (6 * 60);
  return (minutesFrom6am / (15 * 60)) * 750;
}
```

#### 5.2 Add Current Time Indicator
```javascript
// In ClassroomCalendar.js
const getCurrentTimePosition = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeNum = hours * 100 + minutes;
  return tiempoAPixeles(timeNum);
};

// In render:
<div 
  className="current-time-indicator"
  style={{ top: `${getCurrentTimePosition()}px` }}
/>
```

CSS:
```css
.current-time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e74c3c;
  z-index: 100;
  pointer-events: none;
}

.current-time-indicator::before {
  content: '';
  position: absolute;
  left: -6px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #e74c3c;
}
```

### Phase 6: Design System

#### 6.1 Color Palette
```css
:root {
  /* Primary Colors */
  --primary-blue: #4a90e2;
  --primary-dark: #2c3e50;
  --primary-light: #ecf0f1;
  
  /* Secondary Colors */
  --secondary-green: #27ae60;
  --secondary-yellow: #f39c12;
  --secondary-red: #e74c3c;
  
  /* Grays */
  --gray-100: #f8f9fa;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-700: #495057;
  --gray-900: #212529;
  
  /* Status Colors */
  --available: #27ae60;
  --occupied: #e74c3c;
  --restricted: #95a5a6;
  
  /* 8A/8B Colors */
  --cycle-8a: #ff9f1c;
  --cycle-8b: #25a18e;
  --cycle-full: #4a90e2;
}
```

#### 6.2 Button System
```css
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--primary-blue);
  color: white;
}

.btn-primary:hover {
  background-color: #357abd;
}

.btn-secondary {
  background-color: var(--gray-200);
  color: var(--gray-900);
}

.btn-secondary:hover {
  background-color: var(--gray-300);
}
```

#### 6.3 Typography
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

h1 { font-size: 32px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 24px; font-weight: 600; line-height: 1.3; }
h3 { font-size: 20px; font-weight: 600; line-height: 1.4; }
p { font-size: 16px; line-height: 1.6; }
```

### Phase 7: GitHub Actions

Create `.github/workflows/update-courses.yml`:
```yaml
name: Update Course Data

on:
  schedule:
    # 2nd week of January (semester XXXX10)
    - cron: '0 6 8-14 1 1'  # Monday of 2nd week of Jan
    # 1st week of June (semester XXXX19)
    - cron: '0 6 1-7 6 1'   # Monday of 1st week of June
    # Last week of July (semester XXXX20)
    - cron: '0 6 25-31 7 1' # Monday of last week of July
  workflow_dispatch:

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Determine semester
        id: semester
        run: |
          MONTH=$(date +%m)
          YEAR=$(date +%Y)
          if [ $MONTH -eq 1 ]; then
            SEMESTER="${YEAR}10"
          elif [ $MONTH -eq 6 ]; then
            SEMESTER="${YEAR}19"
          elif [ $MONTH -eq 7 ]; then
            SEMESTER="${YEAR}20"
          fi
          echo "semester=$SEMESTER" >> $GITHUB_OUTPUT
      
      - name: Fetch course data
        run: |
          curl "https://ofertadecursos.uniandes.edu.co/api/courses?term=${{ steps.semester.outputs.semester }}&campus=CAMPUS%20PRINCIPAL&offset=0&limit=10000" \
            -o src/Data/courses${{ steps.semester.outputs.semester }}.json
      
      - name: Validate data
        run: |
          TERM=$(cat src/Data/courses${{ steps.semester.outputs.semester }}.json | jq -r '.[0].term')
          if [ "$TERM" != "${{ steps.semester.outputs.semester }}" ]; then
            echo "Error: Term mismatch! Expected ${{ steps.semester.outputs.semester }}, got $TERM"
            exit 1
          fi
      
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add src/Data/courses${{ steps.semester.outputs.semester }}.json
          git commit -m "Update course data for semester ${{ steps.semester.outputs.semester }}"
          git push
```

### Testing Checklist
- [ ] Buildings page loads and shows buildings in priority order
- [ ] Buildings with no availability are grayed out
- [ ] Clicking building navigates to classrooms
- [ ] Classrooms are organized by floor
- [ ] Merged rooms display correctly
- [ ] Restricted rooms show warning badge
- [ ] Time selection works with quick times
- [ ] Calendar view alignment is correct
- [ ] Current time indicator shows on calendar
- [ ] All pages are mobile responsive
- [ ] GitHub links in footer work

### Mobile Responsiveness
Ensure all components have responsive breakpoints:
- Desktop: > 768px
- Tablet: 480px - 768px
- Mobile: < 480px

Use CSS Grid with `minmax()` and `auto-fill` for automatic responsiveness.
