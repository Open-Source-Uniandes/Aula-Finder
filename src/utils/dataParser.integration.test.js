import { initialize, getAvailableRooms } from './dataParser';

describe('initialize function', () => {
  test('initializes buildings from course data', async () => {
    const mockCourseData = [
      {
        nrc: '12345',
        llave: '12345202610',
        term: '202610',
        ptrm: '1',
        schedules: [
          {
            time_ini: '0800',
            time_fin: '0920',
            classroom: '.ML_101',
            l: 'L',
            m: null,
            i: 'I',
            j: null,
            v: 'V',
            s: null,
            d: null,
            date_ini: '2020-01-01 00:00:00',
            date_fin: '2030-12-31 00:00:00',
            building: '.Mario Laserna (ML)',
            patron: '1'
          }
        ],
        instructors: [{ name: 'Test Professor', ind: 'Y' }],
        levele: 'PRE',
        attr: ['ATTR1']
      }
    ];

    const buildings = await initialize(mockCourseData);
    expect(buildings['ML']).toBeDefined();
    expect(buildings['ML'].name).toBe('ML');
    expect(buildings['ML'].rooms['101']).toBeDefined();
  });

  test('filters out blacklisted buildings', async () => {
    const mockCourseData = [
      {
        nrc: '12345',
        schedules: [
          {
            time_ini: '0800',
            time_fin: '0920',
            classroom: '.VIRT_001',
            l: 'L',
            m: null,
            i: null,
            j: null,
            v: null,
            s: null,
            d: null,
            date_ini: '2020-01-01 00:00:00',
            date_fin: '2030-12-31 00:00:00',
            building: '.Virtual',
            patron: '1'
          }
        ],
        instructors: []
      }
    ];

    const buildings = await initialize(mockCourseData);
    expect(buildings['VIRT']).toBeUndefined();
  });

  test('handles multiple schedules for same course', async () => {
    const mockCourseData = [
      {
        nrc: '12345',
        schedules: [
          {
            time_ini: '0800',
            time_fin: '0920',
            classroom: '.ML_101',
            l: 'L',
            m: null,
            i: null,
            j: null,
            v: null,
            s: null,
            d: null,
            date_ini: '2020-01-01 00:00:00',
            date_fin: '2030-12-31 00:00:00',
            building: '.Mario Laserna (ML)',
            patron: '1'
          },
          {
            time_ini: '1000',
            time_fin: '1120',
            classroom: '.ML_101',
            l: null,
            m: 'M',
            i: null,
            j: 'J',
            v: null,
            s: null,
            d: null,
            date_ini: '2020-01-01 00:00:00',
            date_fin: '2030-12-31 00:00:00',
            building: '.Mario Laserna (ML)',
            patron: '2'
          }
        ],
        instructors: []
      }
    ];

    const buildings = await initialize(mockCourseData);
    const room = buildings['ML'].rooms['101'];
    expect(room.availability[0].length).toBeGreaterThan(0); // Monday (L)
    expect(room.availability[1].length).toBeGreaterThan(0); // Tuesday (M)
  });
});

describe('getAvailableRooms function', () => {
  test('returns all available rooms', () => {
    const mockData = {
      ML: {
        name: 'ML',
        rooms: {
          '101': {
            name: '101',
            isAvailable: (day, hour) => ({
              room: '101',
              available: true,
              time: '10:00',
              after: undefined
            }),
            availability: [[], [], [], [], [], [], []]
          }
        }
      }
    };

    const rooms = getAvailableRooms(mockData, 0, '09:00');
    expect(rooms).toHaveLength(1);
    expect(rooms[0].room).toBe('ML 101');
    expect(rooms[0].available).toBe(true);
  });

  test('filters rooms by building', () => {
    const mockData = {
      ML: {
        name: 'ML',
        rooms: {
          '101': {
            name: '101',
            isAvailable: () => ({ room: '101', available: true, time: '10:00' }),
            availability: [[], [], [], [], [], [], []]
          }
        }
      },
      RGA: {
        name: 'RGA',
        rooms: {
          '201': {
            name: '201',
            isAvailable: () => ({ room: '201', available: true, time: '10:00' }),
            availability: [[], [], [], [], [], [], []]
          }
        }
      }
    };

    const rooms = getAvailableRooms(mockData, 0, '09:00', 'ML');
    expect(rooms).toHaveLength(1);
    expect(rooms[0].room).toBe('ML 101');
  });

  test('filters rooms by floor', () => {
    const mockData = {
      ML: {
        name: 'ML',
        rooms: {
          '101': {
            name: '101',
            isAvailable: () => ({ room: '101', available: true, time: '10:00' }),
            availability: [[], [], [], [], [], [], []]
          },
          '201': {
            name: '201',
            isAvailable: () => ({ room: '201', available: true, time: '10:00' }),
            availability: [[], [], [], [], [], [], []]
          }
        }
      }
    };

    const rooms = getAvailableRooms(mockData, 0, '09:00', undefined, '1');
    expect(rooms).toHaveLength(1);
    expect(rooms[0].room).toBe('ML 101');
  });
});
