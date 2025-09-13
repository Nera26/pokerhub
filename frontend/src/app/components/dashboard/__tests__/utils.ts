import React from 'react';
import { screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { renderWithClient } from './renderWithClient';

export const mockMetrics = jest.fn();

export function renderDashboard() {
  return renderWithClient(React.createElement(Dashboard));
}

export function findUserAvatar(username: string) {
  return screen.findByAltText(username);
}
