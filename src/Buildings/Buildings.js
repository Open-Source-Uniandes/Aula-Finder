import './Buildings.css';
import React, { useContext, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Context from '../Context';
import Header from '../Header/Header';

const Buildings = () => {
    const ctx = useContext(Context);

    const [day, setDay] = useState('L');
    const [time, setTime] = useState('--:--');

    const [buildings, setBuildings] = useState({});

    useEffect(() => {
        const d = sessionStorage.getItem('selected-day');
        const t = sessionStorage.getItem('selected-time');

        if (d && t) updatePage(d,t);
        else now();
        // eslint-disable-next-line
    }, [ctx.data]);

    const updatePage = async (d,t, set=false) => {
        if (d) setDay(d);
        else d = day;
        if (t) setTime(t);
        else t = time;

        if (set) {
            sessionStorage.setItem('selected-day', d);
            sessionStorage.setItem('selected-time', t);
        }

        const response = ctx.getAvailableRooms(ctx.days.indexOf(d.toLowerCase()),t);

        let bd = {}
        for (const room of response) {
            // Don't count restricted rooms in availability
            if (!room.restricted && room.available) {
                const b = room.room.split(' ')[0];
                bd[b] = bd[b] ? bd[b]+1 : 1;
            }
        }

        setBuildings(bd);
    }

    const now = () => {
        const today = new Date();

        let day = today.getDay();
        day = day ? day-1 : 6;
        const hour = today.getHours();
        const minute = today.getMinutes();

        const d = ctx.days[day].toUpperCase();
        const t = `${hour < 10 ? '0'+hour : hour}:${minute < 10 ? '0'+minute : minute}`;

        sessionStorage.removeItem('selected-day');
        sessionStorage.removeItem('selected-time');

        updatePage(d, t);
    }

    // Order buildings by priority
    const getOrderedBuildings = () => {
        const priorityList = ctx.buildingConfig?.priorityBuildings || [];
        const buildingNames = ctx.buildingConfig?.buildingNames || {};
        
        const ordered = [];
        
        // First add priority buildings in order
        priorityList.forEach(code => {
            if (ctx.data && ctx.data[code]) {
                const available = buildings[code] || 0;
                ordered.push({
                    code,
                    name: buildingNames[code] || code,
                    available,
                    isPriority: true
                });
            }
        });
        
        // Then add other buildings alphabetically (these are hidden by default, but shown if they exist)
        const otherBuildings = Object.keys(buildings)
            .filter(code => !priorityList.includes(code))
            .sort()
            .map(code => ({
                code,
                name: buildingNames[code] || code,
                available: buildings[code] || 0,
                isPriority: false
            }));
        
        return [...ordered, ...otherBuildings];
    };

    const orderedBuildings = getOrderedBuildings();

    return (
      <React.Fragment>
        <Header backhref='/'/>
        <main>
          <section className="select-time">
              <select name="select-day" id="select-day" 
                value={day}
                onChange={e => updatePage(e.target.value, null, true)}
                >
                  <option value="L">Lunes</option>
                  <option value="M">Martes</option>
                  <option value="I">Miércoles</option>
                  <option value="J">Jueves</option>
                  <option value="V">Viernes</option>
                  <option value="S">Sábado</option>
                  <option value="D">Domingo</option>
              </select>
        
              <input type="time" name="select-hour" id="select-hour" 
                value={time}
                onChange={e => updatePage(null, e.target.value, true)}
                />
        
              <button type="button" id="btn-update-time" onClick={now}>
                  Ahora
              </button>
          </section>

          <section className="buildings-grid">
            {
                orderedBuildings.map(({code, name, available}) => {
                const hasAvailability = available > 0;
                return (
                <Link className="avoid-underline" to={'/classrooms/'+code} key={code}>
                    <article className={`building-card ${!hasAvailability ? 'no-availability' : ''}`}>
                        <div className="building-image-container">
                            <img 
                                src={`${process.env.PUBLIC_URL}/images/buildings/campus-uniandes.jpg`}
                                alt={name}
                                className="building-image"
                                onError={(e) => {
                                    e.target.src = `${process.env.PUBLIC_URL}/images/buildings/campus-uniandes.jpg`;
                                }}
                            />
                        </div>
                        <div className="building-info">
                            <h2 className="building-name">{name}</h2>
                            <span className="building-code">{code}</span>
                        </div>
                    </article>
                </Link>
                )})
            }
          </section>

      </main>
      </React.Fragment>
    )
}

export default Buildings;