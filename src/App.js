import './App.css';
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Context from './Context';
import Welcome from './Welcome/Welcome';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import Buildings from './Buildings/Buildings';
import Classrooms from './Classrooms/Classrooms';
import courseFile from './Data/courses202610.json';
import FloatingMailbox from 'react-floating-mailbox';
import { initialize } from './utils/dataParser';

const days = ['l', 'm', 'i', 'j', 'v', 's', 'd'];

const App = () => {
  const [data, setData] = useState(undefined);

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
        let room_availability = room.isAvailable(day, hour);
        room_availability["room"] = building_name+" "+room_availability["room"];
        available_rooms.push(room_availability);
      }
    }
    return available_rooms;
  }

  useEffect(() => {

    // 1.0 Carga la informacion de los salones desde el archivo JSON
    const loadData = async () => {
      const dt = await initialize(courseFile);  
      setData(dt); // En este punto se quita el símbolo de carga de la pantalla principal
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
            data,
            getAvailableRooms
          }}
        >
          {/* <Header/> va dento de cada uno*/}
            <BrowserRouter basename="/Sobrecupo">
            <Routes>
              <Route path="/" element={<Welcome/>}/>
              <Route path="/buildings" element={<Buildings/>}/>
              <Route path="/classrooms/:building" element={<Classrooms/>}/>
              <Route path="*" element={<PageNotFound/>}/>
            </Routes>
            </BrowserRouter>
          <Footer/>
        </Context.Provider>
      </div>
      <FloatingMailbox
        to="TODO@gmail.com"
        subject="AulaFinder"
        header="¡Cuéntanos tu experiencia, o escríbenos alguna nueva idea que tengas para implementar!"
        serviceId="TODO: Cambiar serviceId"
        templateId="TODO: Cambiar templateId"
        userId="TODO: Cambiar userId"
        lang="es"
      />
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
