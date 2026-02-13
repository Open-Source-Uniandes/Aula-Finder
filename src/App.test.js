import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Welcome from './Welcome/Welcome';
import Context from './Context';

const mockContext = {
  days: ['l', 'm', 'i', 'j', 'v', 's', 'd'],
  data: {
    ML: {
      name: 'ML',
      rooms: {
        '101': {
          name: '101',
          isAvailable: () => ({ room: '101', available: true, time: '10:00' }),
          availability: [[], [], [], [], [], [], []]
        }
      }
    }
  },
  getAvailableRooms: () => []
};

test('renders welcome page with header', () => {
  render(
    <MemoryRouter>
      <Context.Provider value={mockContext}>
        <Welcome />
      </Context.Provider>
    </MemoryRouter>
  );
  const headerElements = screen.getAllByText(/AulaFinder/i);
  expect(headerElements.length).toBeGreaterThan(0);
});

test('renders welcome message', () => {
  render(
    <MemoryRouter>
      <Context.Provider value={mockContext}>
        <Welcome />
      </Context.Provider>
    </MemoryRouter>
  );
  const welcomeText = screen.getByText(/Buscando salón/i);
  expect(welcomeText).toBeInTheDocument();
});
