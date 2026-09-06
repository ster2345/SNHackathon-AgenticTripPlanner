import { act, render, screen } from '@testing-library/react';
import App from './App';

test('renders the team dashboard home', async () => {
  await act(async () => { render(<App />); });
  const linkElement = screen.getByRole('heading', { name: /where are we headed/i });
  expect(linkElement).toBeInTheDocument();
});
