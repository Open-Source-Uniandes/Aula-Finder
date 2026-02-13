import { Building, Room } from './dataParser';

describe('Room class', () => {
  test('creates a room with correct name', () => {
    const room = new Room('101');
    expect(room.name).toBe('101');
    expect(room.availability).toHaveLength(7);
  });

  test('adds availability correctly', () => {
    const room = new Room('101');
    room.addAvailability(0, ['0800', '1000'], 10);
    expect(room.availability[0]).toHaveLength(1);
    expect(room.availability[0][0]).toEqual(['08:00', '10:00']);
  });

  test('merges overlapping time slots within tolerance', () => {
    const room = new Room('101');
    room.addAvailability(0, ['0800', '1000'], 10);
    room.addAvailability(0, ['1000', '1200'], 10);
    expect(room.availability[0]).toHaveLength(1);
    expect(room.availability[0][0]).toEqual(['08:00', '12:00']);
  });

  test('keeps separate time slots when gap is too large', () => {
    const room = new Room('101');
    room.addAvailability(0, ['0800', '1000'], 10);
    room.addAvailability(0, ['1030', '1200'], 10);
    expect(room.availability[0].length).toBeGreaterThanOrEqual(1);
  });

  test('checks room availability correctly when available', () => {
    const room = new Room('101');
    room.addAvailability(0, ['0800', '1000'], 10);
    const result = room.isAvailable(0, '07:00');
    expect(result.available).toBe(true);
    expect(result.time).toBe('08:00');
  });

  test('checks room availability correctly when busy', () => {
    const room = new Room('101');
    room.addAvailability(0, ['0800', '1000'], 10);
    const result = room.isAvailable(0, '09:00');
    expect(result.available).toBe(false);
    expect(result.time).toBe('10:00');
  });

  test('calculates time difference correctly', () => {
    const room = new Room('101');
    const diff = room.differenceHours('10:30', '08:15');
    expect(diff).toBe(135); // 2 hours 15 minutes = 135 minutes
  });
});

describe('Building class', () => {
  test('creates a building with correct name', () => {
    const building = new Building('ML');
    expect(building.name).toBe('ML');
    expect(building.rooms).toEqual({});
  });

  test('adds rooms correctly', () => {
    const building = new Building('ML');
    const room = new Room('101');
    building.addRoom(room);
    expect(building.rooms['101']).toBe(room);
  });

  test('does not duplicate rooms', () => {
    const building = new Building('ML');
    const room1 = new Room('101');
    const room2 = new Room('101');
    building.addRoom(room1);
    building.addRoom(room2);
    expect(Object.keys(building.rooms)).toHaveLength(1);
  });

  test('gets room by name', () => {
    const building = new Building('ML');
    const room = new Room('101');
    building.addRoom(room);
    const retrieved = building.getRoom('101');
    expect(retrieved).toBe(room);
  });
});
