const days = ['l', 'm', 'i', 'j', 'v', 's', 'd'];

export class Building {
  constructor(name) {
    this.name = name;
    this.rooms = {};
  }

  addRoom(room) {
    if (this.rooms[room.name] == null) {
      this.rooms[room.name] = room;
    }
  }

  getRoom(room_name) {
    return this.rooms[room_name];
  }
}

export class Room {
  constructor(name) {
    this.name = name;
    this.availability = Array(7);
    for (let i = 0; i <= 6; i++) {
      this.availability[i] = [];
    }
  }

  addAvailability(day, availability, timeIgnore) {
    let auxAvailability = [
      availability[0].slice(0, 2) + ':' + availability[0].slice(2),
      availability[1].slice(0, 2) + ':' + availability[1].slice(2)
    ];
    let i = 0;
    while (i < this.availability[day].length) {
      let todayAvailability = this.availability[day][i];
      if (
        this.differenceHours(todayAvailability[0], auxAvailability[1]) <=
          timeIgnore &&
        this.differenceHours(todayAvailability[0], auxAvailability[1]) > 0
      ) {
        let newAvailability = [...todayAvailability];
        newAvailability[0] = auxAvailability[0];
        this.availability[day].splice(i, 1);
        this.addAvailability(
          day,
          newAvailability.map(item => item.replace(':', '')),
          timeIgnore
        );
        return;
      } else if (
        this.differenceHours(auxAvailability[0], todayAvailability[1]) <=
          timeIgnore &&
        this.differenceHours(todayAvailability[0], auxAvailability[1]) <=
          timeIgnore >
          0
      ) {
        let newAvailability = [...todayAvailability];
        newAvailability[1] = auxAvailability[1];
        this.availability[day].splice(i, 1);
        this.addAvailability(
          day,
          newAvailability.map(item => item.replace(':', '')),
          timeIgnore
        );
        return;
      }
      i++;
    }
    this.availability[day].push(auxAvailability);
  }

  isAvailable(day, hour) {
    let todayAvailability = this.availability[day];
    let isBusy = false;
    let minDifference = null;
    let nextTime = '23:59';
    let stopBusy = null;
    for (let availability of todayAvailability) {
      let difference = this.differenceHours(availability[0], hour);
      if (difference > 0 && (minDifference === null || difference < minDifference)) {
        minDifference = difference;
        nextTime = availability[0];
      }
      if (hour >= availability[0] && hour <= availability[1]) {
        stopBusy = availability[1];
        isBusy = true;
      }
    }
    if (isBusy) {
      return { room: this.name, available: !isBusy, time: stopBusy, after: nextTime };
    } else {
      return { room: this.name, available: !isBusy, time: nextTime, after: undefined };
    }
  }

  differenceHours(hour_a, hour_b) {
    var dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    return (
      dot(hour_a.split(':').map(Number), [60, 1]) -
      dot(hour_b.split(':').map(Number), [60, 1])
    );
  }
}

export const initialize = async (roomsJson) => {
  const buildings = {};
  let response = roomsJson;
  let building_blacklist = [
    '0',
    '',
    ' -',
    'VIRT',
    'NOREQ',
    'SALA',
    'LIGA',
    'LAB',
    'FEDELLER',
    'ES',
    'FSFB',
    'HFONTIB',
    'HLSAMAR',
    'HLVICT',
    'HSBOLIV',
    'HSUBA',
    'IMI',
    'MEDLEG',
    'SVICENP',
    'ZIPAUF'
  ];

  let actual_date = new Date();

  for (let element of response) {
    for (let pattern of element.schedules) {
      let date_ini = new Date(pattern.date_ini);
      let date_fin = new Date(pattern.date_fin);

      if (date_ini <= actual_date && date_fin >= actual_date) {
        let classroom = pattern.classroom;
        let building_name = classroom.split('_')[0].slice(1);
        let room_name = classroom.split('_')[1];

        if (building_blacklist.includes(building_name)) {
          continue;
        }

        if (buildings[building_name] == null) {
          buildings[building_name] = new Building(building_name);
        }

        let room = new Room(room_name);
        if (buildings[building_name].getRoom(room_name) == null) {
          buildings[building_name].addRoom(room);
        }

        for (let day = 0; day <= 6; day++) {
          if (pattern[days[day]] !== null) {
            buildings[building_name]
              .getRoom(room_name)
              .addAvailability(day, [pattern.time_ini, pattern.time_fin], 10);
          }
        }

        buildings[building_name].addRoom(room);
      }
    }
  }
  return buildings;
};

export const getAvailableRooms = (data, day, hour, building = undefined, floor = undefined) => {
  let available_rooms = [];
  for (let building_name in data) {
    if (building !== undefined && building_name !== building) {
      continue;
    }

    for (let room_name in data[building_name].rooms) {
      if (floor !== undefined && room_name.slice(0, 1) !== floor) {
        continue;
      }
      const room = data[building_name].rooms[room_name];
      let room_availability = room.isAvailable(day, hour);
      room_availability['room'] = building_name + ' ' + room_availability['room'];
      available_rooms.push(room_availability);
    }
  }
  return available_rooms;
};
