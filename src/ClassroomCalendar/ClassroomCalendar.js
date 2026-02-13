import './ClassroomCalendar.css';
import React, { useContext, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Context from '../Context';
import Header from '../Header/Header';
import {
  tiempoAPixeles,
  timeStringToNumber,
  calculateBlockHeight,
  getDayName,
  getCalendarDays,
  getHourMarkers
} from './timeUtils';

const ClassroomCalendar = () => {
  const ctx = useContext(Context);
  const { building, room } = useParams();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Get room data
  const roomData = ctx.data?.[building]?.rooms?.[room];

  if (!ctx.data || !roomData) {
    return (
      <React.Fragment>
        <Header backhref={`/classrooms/${building}`} />
        <main>
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">
              {!ctx.data ? 'Cargando datos...' : 'Salón no encontrado'}
            </div>
          </div>
        </main>
      </React.Fragment>
    );
  }

  const calendarDays = getCalendarDays();
  const hourMarkers = getHourMarkers();

  const handleCourseClick = (course, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setSelectedCourse(course);
  };

  const closePopover = () => {
    setSelectedCourse(null);
  };

  const getPtrmClass = (ptrm) => {
    if (ptrm === '1' || ptrm === '2' || ptrm === 'D') return 'ptrm-16';
    if (ptrm === '8A') return 'ptrm-8a';
    if (ptrm === '8B') return 'ptrm-8b';
    return 'ptrm-other';
  };

  const getPtrmWidth = (ptrm) => {
    if (ptrm === '1' || ptrm === '2' || ptrm === 'D') return 'course-block-16';
    if (ptrm === '8A') return 'course-block-8a';
    if (ptrm === '8B') return 'course-block-8b';
    return 'course-block-16';
  };

  const getPtrmBadge = (ptrm, ptrmdesc) => {
    if (ptrm === '1' || ptrm === '2' || ptrm === 'D') return '16 sem';
    if (ptrm === '8A') return '8A';
    if (ptrm === '8B') return '8B';
    return ptrmdesc || ptrm;
  };

  const renderCourseBlock = (slot, dayIndex) => {
    const timeStart = timeStringToNumber(slot.timeStart);
    const height = calculateBlockHeight(slot.timeStart, slot.timeEnd);
    const topPosition = tiempoAPixeles(timeStart);
    const course = slot.course;

    return (
      <div
        key={`${dayIndex}-${slot.timeStart}-${course.nrc}`}
        className={`course-block ${getPtrmClass(course.ptrm)} ${getPtrmWidth(course.ptrm)}`}
        style={{
          top: `${topPosition}px`,
          height: `${height}px`
        }}
        onClick={(e) => handleCourseClick(course, e)}
        title="Click para ver detalles"
      >
        <div className="course-block-header">
          {course.class} {course.course}
        </div>
        <div className="course-block-section">
          Sección {course.section}
        </div>
        {height > 40 && (
          <div className="course-block-ptrm-badge">
            {getPtrmBadge(course.ptrm, course.ptrmdesc)}
          </div>
        )}
      </div>
    );
  };

  return (
    <React.Fragment>
      <Header backhref={`/classrooms/${building}`} />
      <main>
        <div className="classroom-calendar-container">
          <div className="classroom-calendar-header">
            <div className="calendar-title">
              <h1>
                {building} {room} - Horario Semanal
              </h1>
              <Link to={`/classrooms/${building}`} className="back-button">
                ← Volver
              </Link>
            </div>
          </div>

          <div className="calendar-grid">
            {/* Time column */}
            <div className="time-column">
              <div className="day-header" style={{ visibility: 'hidden' }}>
                Hora
              </div>
              {hourMarkers.map((marker) => (
                <div key={marker.time} className="time-marker">
                  {marker.label}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {calendarDays.map((dayCode, dayIndex) => (
              <div key={dayCode} className="day-column">
                <div className="day-header">{getDayName(dayCode)}</div>

                {/* Hour lines */}
                {hourMarkers.map((marker) => (
                  <div
                    key={`line-${marker.time}`}
                    className="hour-line"
                    style={{ top: `${tiempoAPixeles(marker.time)}px` }}
                  />
                ))}

                {/* Course blocks */}
                {roomData.getDaySchedule(dayIndex).map((slot) =>
                  renderCourseBlock(slot, dayIndex)
                )}
              </div>
            ))}
          </div>

          {/* Course details popover */}
          {selectedCourse && (
            <>
              <div
                className="popover-overlay"
                onClick={closePopover}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
              />
              <div
                className="course-popover"
                style={{
                  left: `${Math.min(popoverPosition.x, window.innerWidth - 350)}px`,
                  top: `${Math.max(popoverPosition.y - 250, 10)}px`
                }}
              >
                <button className="popover-close" onClick={closePopover}>
                  ×
                </button>
                <div className="popover-title">
                  {selectedCourse.class} {selectedCourse.course} -{' '}
                  {selectedCourse.title}
                </div>
                <div className="popover-field">
                  <strong>Sección:</strong> {selectedCourse.section}
                </div>
                <div className="popover-field">
                  <strong>NRC:</strong> {selectedCourse.nrc}
                </div>
                <div className="popover-field">
                  <strong>Profesor(es):</strong>{' '}
                  {selectedCourse.professors.join(', ')}
                </div>
                <div className="popover-field">
                  <strong>Cupos:</strong> {selectedCourse.enrolled} /{' '}
                  {selectedCourse.maxenrol} (
                  {selectedCourse.seatsavail > 0
                    ? `${selectedCourse.seatsavail} disponibles`
                    : 'completo'}
                  )
                </div>
                <div className="popover-field">
                  <strong>Duración:</strong> {selectedCourse.ptrmdesc}
                </div>

                {selectedCourse.allSchedules &&
                  selectedCourse.allSchedules.length > 1 && (
                    <div className="popover-schedule-list">
                      <strong>Este curso también se dicta en:</strong>
                      {selectedCourse.allSchedules.map((sched, idx) => {
                        const schedBuilding = sched.building
                          ? sched.building.replace(/^\./, '')
                          : '';
                        const schedRoom = sched.classroom
                          ? sched.classroom.split('_')[1]
                          : '';
                        const schedTimeIni = sched.time_ini
                          ? `${sched.time_ini.slice(0, 2)}:${sched.time_ini.slice(2)}`
                          : '';
                        const schedTimeFin = sched.time_fin
                          ? `${sched.time_fin.slice(0, 2)}:${sched.time_fin.slice(2)}`
                          : '';

                        return (
                          <div
                            key={idx}
                            className="popover-schedule-item"
                          >
                            {sched.day?.toUpperCase()} {schedTimeIni}-
                            {schedTimeFin} - {schedBuilding} {schedRoom}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </main>
    </React.Fragment>
  );
};

export default ClassroomCalendar;
