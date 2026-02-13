import './App.css';
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Context from './Context';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import Buildings from './Buildings/Buildings';
import Classrooms from './Classrooms/Classrooms';
import ClassroomCalendar from './ClassroomCalendar/ClassroomCalendar';
import courseFile from './Data/courses202610.json';
import buildingConfig from './Data/config/buildingPriority.json';
import restrictedRoomsConfig from './Data/config/restrictedRooms.json';


//https://ofertadecursos.uniandes.edu.co/api/courses?term=&ptrm=&prefix=&attr=&nameInput=&campus=CAMPUS%20PRINCIPAL&attrs=&timeStart=&offset=0&limit=10000

// CONSTANTES
const days = ['l', 'm', 'i', 'j', 'v', 's', 'd'];
const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Detectar ciclo actual (8A, 8B, o semestre completo)
const detectCurrentCycle = (courses) => {
  const now = new Date();
  
  // Buscar cursos 8A y 8B para determinar sus fechas
  const cycle8A = courses.find(c => c.ptrm === '8A');
  const cycle8B = courses.find(c => c.ptrm === '8B');
  
  if (cycle8A && cycle8A.schedules && cycle8A.schedules[0]) {
    const date8AEnd = new Date(cycle8A.schedules[0].date_fin);
    if (now <= date8AEnd) {
      return '8A';
    }
  }
  
  if (cycle8B && cycle8B.schedules && cycle8B.schedules[0]) {
    const date8BStart = new Date(cycle8B.schedules[0].date_ini);
    const date8BEnd = new Date(cycle8B.schedules[0].date_fin);
    if (now >= date8BStart && now <= date8BEnd) {
      return '8B';
    }
  }
  
  return 'full'; // Semestre completo por defecto
}; 

// CLASES
class Building
{
  constructor(name)
  {
    this.name = name
    this.rooms = {}
  }
  addRoom(room)
  {
    if (this.rooms[room.name] == null)
    {
      this.rooms[room.name] = room
    }
  }
  getRoom(room_name)
  {
    return this.rooms[room_name]
  }
}

class Room
{
  constructor(name)
  {
    this.name = name
    // Store course details for each time slot per day
    this.schedule = Array(7)
    for (let i=0; i<=6; i++)
    {
      this.schedule[i] = [] // Array of {timeStart, timeEnd, course} objects
    }
  }

  addSchedule(day, timeStart, timeEnd, courseInfo) 
  {
    // Format times as HH:MM
    const formattedStart = timeStart.slice(0, 2) + ":" + timeStart.slice(2);
    const formattedEnd = timeEnd.slice(0, 2) + ":" + timeEnd.slice(2);
    
    // Add the schedule entry with course information
    this.schedule[day].push({
      timeStart: formattedStart,
      timeEnd: formattedEnd,
      course: courseInfo
    });
  }

  // Legacy method for backward compatibility - returns time ranges only
  get availability() {
    const availability = Array(7);
    for (let i = 0; i <= 6; i++) {
      availability[i] = this.schedule[i].map(slot => [slot.timeStart, slot.timeEnd]);
    }
    return availability;
  }

  // Get course info for a specific day and time
  getCourseAt(day, hour) {
    const daySchedule = this.schedule[day];
    for (const slot of daySchedule) {
      if (hour >= slot.timeStart && hour <= slot.timeEnd) {
        return slot.course;
      }
    }
    return null;
  }

  // Get all schedule entries for a specific day
  getDaySchedule(day) {
    return this.schedule[day];
  }

  isAvailable(day, hour){
    let todaySchedule = this.schedule[day]
    let isBusy = false
    let minDifference = null
    let nextTime = "23:59"
    let stopBusy = null
    let currentCourse = null
    let nextCourse = null
    
    for (let slot of todaySchedule){
      let difference = this.differenceHours(slot.timeStart, hour)
      if(difference>0 && (minDifference === null || difference < minDifference)){
        minDifference = difference
        nextTime = slot.timeStart
        nextCourse = slot.course
      }
      if(hour>=slot.timeStart && hour<=slot.timeEnd){
        stopBusy = slot.timeEnd
        currentCourse = slot.course
        isBusy = true
      }
    }
    if (isBusy){
      return {
        "room":this.name, 
        "available":!isBusy, 
        "time":stopBusy, 
        "after":nextTime,
        "currentCourse": currentCourse,
        "nextCourse": nextCourse
      }
    }
    else {
      return {
        "room":this.name, 
        "available":!isBusy, 
        "time":nextTime, 
        "after": undefined,
        "currentCourse": null,
        "nextCourse": nextCourse
      }
    } 
  }

  differenceHours(hour_a, hour_b){
    var dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    return dot(hour_a.split(":").map(Number), [60,1])-dot(hour_b.split(":").map(Number), [60,1])
  }

}

// FUNCIÓN DE INICIALIZACIÓN DE LOS SALONES
const initialize = async (roomsJson) => {
  const buildings = {};
  let response = roomsJson;
  
  // Use whitelist approach instead of blacklist
  let building_blacklist = [
    "0", "", " -", "VIRT", "NOREQ", "SALA", "LIGA", "LAB", "FEDELLER", "ES", "FSFB", 
    "HFONTIB", "HLSAMAR", "HLVICT", "HSBOLIV", "HSUBA", "IMI", "MEDLEG", "SVICENP", "ZIPAUF"
  ];

  let actual_date = new Date();

  for (let element of response ) {
    // Prepare course info object that will be stored with each schedule
    const courseInfo = {
      class: element.class,
      course: element.course,
      section: element.section,
      title: element.title,
      nrc: element.nrc,
      ptrm: element.ptrm,
      ptrmdesc: element.ptrmdesc,
      professors: element.instructors.map(inst => inst.name),
      enrolled: element.enrolled,
      maxenrol: element.maxenrol,
      seatsavail: element.seatsavail,
      term: element.term,
      date_ini: element.schedules && element.schedules[0] ? element.schedules[0].date_ini : null,
      date_fin: element.schedules && element.schedules[0] ? element.schedules[0].date_fin : null,
      allSchedules: element.schedules.map(s => ({
        day: days.find(d => s[d] !== null),
        time_ini: s.time_ini,
        time_fin: s.time_fin,
        classroom: s.classroom,
        building: s.building
      }))
    };

    for (let pattern of element.schedules) {
      let date_ini = new Date(pattern.date_ini);
      let date_fin = new Date(pattern.date_fin);

      if (date_ini <= actual_date && date_fin >= actual_date) {

        let classroom = pattern.classroom;
        let building_name = (classroom.split("_")[0]).slice(1,);
        let room_name = classroom.split("_")[1];

        //Ignora los edificios que no se quieren mostrar
        if (building_blacklist.includes(building_name)) {
          continue;
        }
        
        if (buildings[building_name] == null) {
          buildings[building_name] = new Building(building_name)
        }

        let room = new Room(room_name);
        if (buildings[building_name].getRoom(room_name) == null) {
          buildings[building_name].addRoom(room)
        }

        for (let day=0; day<=6; day++) {
          if (pattern[days[day]] !== null) {
            buildings[building_name].getRoom(room_name).addSchedule(
              day, 
              pattern.time_ini, 
              pattern.time_fin, 
              courseInfo
            );
          }
        }

        buildings[building_name].addRoom(room);
      }
    } 
  }
  
  return buildings;
}

const App = () => {
  const [data, setData] = useState(undefined);
  const [currentCycle, setCurrentCycle] = useState('full');
  const [dataUpdateDate, setDataUpdateDate] = useState(null);

  // FUNCIÓN PARA OBTENER LA DISPONIBILIDAD DE LOS CURSOS
  const getAvailableRooms = (day, hour, building=undefined, floor=undefined) => {
    let available_rooms = [];
    for (let building_name in data) {
      //Revisa si el edificio es el correcto en caso dado que sea dado por parametro
      if(building !== undefined && building_name !== building){
        continue;
      }
      
      for (let room_name in data[building_name].rooms) {
        //Revisar si el piso es el correcto en caso dado que haya piso
        if (floor !== undefined && room_name.slice(0,1) !== floor) {
          continue;
        }
        const room = data[building_name].rooms[room_name];
        
        // Check if room is restricted
        const roomKey = `${building_name}_${room_name}`;
        const isRestricted = restrictedRoomsConfig.roomComments && restrictedRoomsConfig.roomComments[roomKey];
        
        let room_availability = room.isAvailable(day, hour);
        room_availability["room"] = building_name+" "+room_availability["room"];
        room_availability["restricted"] = isRestricted || false;
        room_availability["restrictionReason"] = isRestricted ? restrictedRoomsConfig.roomComments[roomKey] : null;
        available_rooms.push(room_availability);
      }
    }
    return available_rooms;
  }

  // Helper function to check if a room is restricted
  const isRoomRestricted = (building, room) => {
    const roomKey = `${building}_${room}`;
    return restrictedRoomsConfig.roomComments && restrictedRoomsConfig.roomComments[roomKey];
  };

  useEffect(() => {
    // 1.0 Carga la informacion de los salones desde el archivo JSON
    const loadData = async () => {
      const dt = await initialize(courseFile);  
      setData(dt); // En este punto se quita el símbolo de carga de la pantalla principal
      
      // Detect current cycle
      const cycle = detectCurrentCycle(courseFile);
      setCurrentCycle(cycle);
      
      // Set data update date (from file or current date)
      setDataUpdateDate(new Date().toISOString());
      
      return;
    }
    loadData();
  }, []);

  return (
    <>
      <div className="App">
        <Context.Provider 
          value={{
            days,
            dayNames,
            data,
            getAvailableRooms,
            buildingConfig,
            restrictedRoomsConfig,
            isRoomRestricted,
            currentCycle,
            setCurrentCycle,
            dataUpdateDate
          }}
        >
          {/* <Header/> va dentro de cada uno*/}
            <BrowserRouter basename="/Sobrecupo">
            <Routes>
              <Route path="/" element={<Navigate to="/buildings" replace />}/>
              <Route path="/buildings" element={<Buildings/>}/>
              <Route path="/classrooms/:building" element={<Classrooms/>}/>
              <Route path="/classroom/:building/:room" element={<ClassroomCalendar/>}/>
              <Route path="*" element={<PageNotFound/>}/>
            </Routes>
            </BrowserRouter>
          <Footer/>
        </Context.Provider>
      </div>
    </>
  );
}

const PageNotFound = () => {
  return (
    <>
    <Header backhref='/'/>
    <main>
      <section>
          <article className="information">
              <h2>404</h2>
              <p>No encontramos la página que buscas <span role="img" aria-label="Sad">🙁</span></p>
          </article>
      </section>
    </main>
    </>
  );
}

export default App;
