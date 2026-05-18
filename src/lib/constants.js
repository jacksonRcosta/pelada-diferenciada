export const SCOUTS = [
  { id: 'defesa',      name: 'Defesa Difícil', pts: 3,  c: { fg: '#185FA5', bg: '#E6F1FB', dk: '#0C447C' } },
  { id: 'desarme',     name: 'Desarme',        pts: 2,  c: { fg: '#1D9E75', bg: '#E1F5EE', dk: '#085041' } },
  { id: 'gol',         name: 'Gol',            pts: 5,  c: { fg: '#BA7517', bg: '#FAEEDA', dk: '#633806' } },
  { id: 'assistencia', name: 'Assistência',    pts: 3,  c: { fg: '#534AB7', bg: '#EEEDFE', dk: '#3C3489' } },
  { id: 'falha',       name: 'Falha',          pts: -2, c: { fg: '#A32D2D', bg: '#FCEBEB', dk: '#791F1F' } },
  { id: 'golplaca',    name: 'Gol de Placa',   pts: 8,  c: { fg: '#993C1D', bg: '#FAECE7', dk: '#712B13' } },
]

export const CARDS = [
  { id: 'amarelo',  name: 'Amarelo',  emoji: '🟨', color: '#B7770D', bg: '#FEF9E7' },
  { id: 'vermelho', name: 'Vermelho', emoji: '🟥', color: '#C0392B', bg: '#FDEDEC' },
  { id: 'azul',     name: 'Azul',    emoji: '🟦', color: '#155FA0', bg: '#E8F1FB' },
]

export const TEAM_CFG = [
  { color: '#1a3a6b', bg: '#EBF0FA' }, { color: '#C0392B', bg: '#FDEDEC' },
  { color: '#6C3483', bg: '#F5EEF8' }, { color: '#117A65', bg: '#E9F7F4' },
  { color: '#B7770D', bg: '#FEF9E7' }, { color: '#2E4057', bg: '#E8ECF0' },
]

export const TEAM_NAMES = ['Time A', 'Time B', 'Time C', 'Time D', 'Time E', 'Time F']

export const AV_COLS = [
  ['#EBF0FA','#1a3a6b'],['#E1F5EE','#085041'],['#FAEEDA','#633806'],
  ['#EEEDFE','#3C3489'],['#EAF3DE','#27500A'],['#FBEAF0','#72243E'],
  ['#FAECE7','#712B13'],['#FCEBEB','#791F1F'],
]

export const INITIAL_STATE = {
  players: [], nextId: 1, teams: null, schedule: [],
  activeMatch: -1, matchA: -1, matchB: -1,
  scoreA: 0, scoreB: 0, matchFinished: false, matchHistory: [],
}
