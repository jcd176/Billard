import React from 'react';

export default function DashboardPage({ user, onSelectSport, onLogout }) {
  // Liste des sports avec leurs icônes associées
  const sports = [
    { id: 'billard', name: 'Billard', icon: '🎱' },
    { id: 'pingpong', name: 'Ping Pong', icon: '🏓' },
    { id: 'skate', name: 'Skate', icon: '🛹' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'palets', name: 'Palets', icon: '🎯' },
    { id: 'petanque', name: 'Pétanque', icon: '🔘' },
    { id: 'babyfoot', name: 'Baby Foot', icon: '⚽' }
  ];

  return (
    <div className="card" style={{ position: 'relative',
