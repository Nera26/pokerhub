'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCog,
  faTimes,
  faPlay,
  faChartLine,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import {
  Table as UiTable,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';

type Status = 'Active' | 'Full' | 'Inactive';

type TableInfo = {
  id: string; // e.g. #T-0451
  name: string; // e.g. High Roller VIP
  stakes: string; // $10/$20
  players: string; // 9/9
  buyinRange: string; // $2,000 - $20,000
  status: Status;
  revenue?: string; // $12,840
  change?: string; // +15% this week
};

const initialTables: TableInfo[] = [
  {
    id: '#T-0451',
    name: 'High Roller VIP',
    stakes: '$10/$20',
    players: '9/9',
    buyinRange: '$2,000 - $20,000',
    status: 'Active',
    revenue: '$12,840',
    change: '+15% this week',
  },
  {
    id: '#T-0452',
    name: 'Mid Stakes Pro',
    stakes: '$2/$5',
    players: '6/6',
    buyinRange: '$500 - $5,000',
    status: 'Full',
    revenue: '$8,420',
    change: '+8% this week',
  },
  {
    id: '#T-0453',
    name: 'Beginner Friendly',
    stakes: '$0.25/$0.50',
    players: '0/6',
    buyinRange: '$25 - $250',
    status: 'Inactive',
  },
  {
    id: '#T-0454',
    name: 'Tournament Practice',
    stakes: '$1/$2',
    players: '3/9',
    buyinRange: '$200 - $2,000',
    status: 'Active',
    revenue: '$3,240',
    change: '+2% this week',
  },
  {
    id: '#T-0455',
    name: 'Weekend Warriors',
    stakes: '$5/$10',
    players: '7/9',
    buyinRange: '$1,000 - $10,000',
    status: 'Active',
    revenue: '$15,620',
    change: '+22% this week',
  },
];

export default function ManageTables() {
  const [tables, setTables] = useState<TableInfo[]>(initialTables);

  // modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);

  // selection
  const [selected, setSelected] = useState<TableInfo | null>(null);

  // create form fields
  const [newName, setNewName] = useState('');
  const [newGame, setNewGame] = useState("Texas Hold'em");
  const [newSeats, setNewSeats] = useState('9');
  const [newRake, setNewRake] = useState(5);
  const [newSB, setNewSB] = useState<number | ''>('');
  const [newBB, setNewBB] = useState<number | ''>('');
  const [newMinBuy, setNewMinBuy] = useState<number | ''>('');
  const [newMaxBuy, setNewMaxBuy] = useState<number | ''>('');
  const [autoStart, setAutoStart] = useState(false);

  const openConfigure = (t: TableInfo) => {
    setSelected(t);
    setConfigureOpen(true);
  };
  const openClose = (t: TableInfo) => {
    setSelected(t);
    setCloseOpen(true);
  };
  const openRevenue = (t: TableInfo) => {
    setSelected(t);
    setRevenueOpen(true);
  };

  const markClosed = () => {
    if (!selected) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? {
              ...t,
              status: 'Inactive',
              players: '0/9',
              revenue: '$0',
              change: '-',
            }
          : t,
      ),
    );
    setCloseOpen(false);
  };

  const createTable = () => {
    const idNum = 450 + tables.length + 1;
    const fresh: TableInfo = {
      id: `#T-0${idNum}`,
      name: newName || 'New Cash Table',
      stakes: newSB && newBB ? `$${newSB}/${newBB}` : '$1/$2',
      players: '0/' + newSeats,
      buyinRange:
        newMinBuy && newMaxBuy ? `$${newMinBuy} - $${newMaxBuy}` : '$50 - $500',
      status: autoStart ? 'Active' : 'Inactive',
      revenue: autoStart ? '$0' : undefined,
      change: autoStart ? '-' : undefined,
    };
    setTables([fresh, ...tables]);
    setCreateOpen(false);
    // reset fields
    setNewName('');
    setNewGame("Texas Hold'em");
    setNewSeats('9');
    setNewRake(5);
    setNewSB('');
    setNewBB('');
    setNewMinBuy('');
    setNewMaxBuy('');
    setAutoStart(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Tables</h2>
          <p className="text-text-secondary">Oversee all cash game tables</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Create New Table
        </Button>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((t) => {
          const statusPill =
            t.status === 'Active' ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent-green rounded-full" />
                <span className="text-accent-green text-sm font-semibold">
                  Active
                </span>
              </div>
            ) : t.status === 'Full' ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent-yellow rounded-full" />
                <span className="text-accent-yellow text-sm font-semibold">
                  Full
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-text-secondary rounded-full" />
                <span className="text-text-secondary text-sm font-semibold">
                  Inactive
                </span>
              </div>
            );

          return (
            <Card
              key={t.id}
              className="p-6 hover:bg-hover-bg transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <p className="text-text-secondary text-sm">
                    Table ID: {t.id}
                  </p>
                </div>
                {statusPill}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Stakes</span>
                  <span className="text-accent-yellow font-bold">
                    {t.stakes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Players</span>
                  <span
                    className={
                      t.status === 'Active'
                        ? 'text-accent-green font-bold'
                        : t.status === 'Full'
                          ? 'text-accent-yellow font-bold'
                          : 'text-text-secondary font-bold'
                    }
                  >
                    {t.players}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Buy-in Range</span>
                  <span className="text-text-primary font-semibold">
                    {t.buyinRange}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Revenue</span>
                  <div className="text-right">
                    <div
                      className={
                        t.revenue
                          ? 'text-accent-green font-bold'
                          : 'text-text-secondary font-bold'
                      }
                    >
                      {t.revenue ?? '$0'}
                    </div>
                    <div
                      className={
                        t.change?.startsWith('+')
                          ? 'text-accent-green text-xs'
                          : 'text-text-secondary text-xs'
                      }
                    >
                      {t.change ?? '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* actions */}
              <div className="flex gap-2 mb-2">
                <button
                  className="flex-1 border-2 border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-black py-2 rounded-xl font-semibold"
                  onClick={() => openConfigure(t)}
                >
                  <FontAwesomeIcon icon={faCog} className="mr-2" />
                  Configure
                </button>

                {t.status === 'Inactive' ? (
                  <button
                    className="flex-1 bg-accent-green hover-glow-green py-2 rounded-xl font-semibold text-white"
                    onClick={() => {
                      setTables((prev) =>
                        prev.map((x) =>
                          x.id === t.id
                            ? {
                                ...x,
                                status: 'Active',
                                players: x.players.replace(/^0\//, '1/'),
                              }
                            : x,
                        ),
                      );
                    }}
                  >
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    Open
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-danger-red hover:brightness-110 py-2 rounded-xl font-semibold text-white"
                    onClick={() => openClose(t)}
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    Close
                  </button>
                )}
              </div>

              <button
                className="w-full text-accent-blue text-sm font-semibold hover:text-blue-400"
                onClick={() => openRevenue(t)}
              >
                <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                Revenue Log
              </button>
            </Card>
          );
        })}
      </section>

      {/* Create Table Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Create New Table</h3>
          <button
            onClick={() => setCreateOpen(false)}
            className="text-text-secondary hover:text-white"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Table Name"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
          />
          <div>
            <label className="block text-text-secondary mb-2">Game Type</label>
            <select
              className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-white focus:border-accent-yellow focus:outline-none"
              value={newGame}
              onChange={(e) => setNewGame(e.currentTarget.value)}
            >
              <option>Texas Hold&apos;em</option>
              <option>Omaha 4-Hand</option>
              <option>Omaha 6-Hand</option>
              <option>All-in-or-Fold</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary mb-2">
                Seat Count
              </label>
              <select
                className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-white focus:border-accent-yellow focus:outline-none"
                value={newSeats}
                onChange={(e) => setNewSeats(e.currentTarget.value)}
              >
                <option>6</option>
                <option>9</option>
              </select>
            </div>
            <Input
              label="Rake %"
              type="number"
              min={0}
              max={15}
              value={newRake}
              onChange={(e) => setNewRake(Number(e.currentTarget.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Small Blind"
              type="number"
              value={newSB}
              onChange={(e) =>
                setNewSB(
                  e.currentTarget.value ? Number(e.currentTarget.value) : '',
                )
              }
            />
            <Input
              label="Big Blind"
              type="number"
              value={newBB}
              onChange={(e) =>
                setNewBB(
                  e.currentTarget.value ? Number(e.currentTarget.value) : '',
                )
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Buy-in"
              type="number"
              value={newMinBuy}
              onChange={(e) =>
                setNewMinBuy(
                  e.currentTarget.value ? Number(e.currentTarget.value) : '',
                )
              }
            />
            <Input
              label="Max Buy-in"
              type="number"
              value={newMaxBuy}
              onChange={(e) =>
                setNewMaxBuy(
                  e.currentTarget.value ? Number(e.currentTarget.value) : '',
                )
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-text-secondary">Auto Start</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.currentTarget.checked)}
              />
              <div
                className={`w-14 h-8 rounded-full transition ${autoStart ? 'bg-accent-green' : 'bg-dark'}`}
              />
              <div
                className={`absolute w-6 h-6 bg-white rounded-full transform transition ${autoStart ? 'translate-x-6 right-1' : 'left-1'}`}
                style={{ top: 4 }}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setCreateOpen(false)}
            className="flex-1 border border-dark text-text-secondary py-3 rounded-xl font-semibold hover:bg-hover-bg"
          >
            Cancel
          </button>
          <button
            onClick={createTable}
            className="flex-1 bg-accent-green hover-glow-green py-3 rounded-xl font-bold text-white"
          >
            Create Table
          </button>
        </div>
      </Modal>

      {/* Configure Table Modal */}
      <Modal isOpen={configureOpen} onClose={() => setConfigureOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Configure Table</h3>
          <button
            onClick={() => setConfigureOpen(false)}
            className="text-text-secondary hover:text-white"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {selected && (
          <>
            <Input
              label="Table Name"
              value={selected.name}
              onChange={() => {}}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Small Blind"
                type="number"
                value={Number(selected.stakes.replace('$', '').split('/')[0])}
                onChange={() => {}}
              />
              <Input
                label="Big Blind"
                type="number"
                value={Number(selected.stakes.replace('$', '').split('/')[1])}
                onChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Min Buy-in"
                type="number"
                value={Number(
                  (selected.buyinRange.match(/\$([\d,]+)/)?.[1] || '0').replace(
                    /,/g,
                    '',
                  ),
                )}
                onChange={() => {}}
              />
              <Input
                label="Max Buy-in"
                type="number"
                value={Number(
                  (
                    selected.buyinRange.match(/\$[\d,]+\s-\s\$([\d,]+)/)?.[1] ||
                    '0'
                  ).replace(/,/g, ''),
                )}
                onChange={() => {}}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Rake %"
                type="number"
                min={0}
                max={15}
                value={5}
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="text-text-secondary">Auto Start</label>
              <div className="relative">
                <div className="block bg-accent-green w-14 h-8 rounded-full"></div>
                <div className="dot absolute right-1 top-1 bg-white w-6 h-6 rounded-full"></div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfigureOpen(false)}
                className="flex-1 border border-dark text-text-secondary py-3 rounded-xl font-semibold hover:bg-hover-bg"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfigureOpen(false)}
                className="flex-1 bg-accent-yellow hover:brightness-110 py-3 rounded-xl font-bold text-black"
              >
                Save Changes
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Close Table Confirmation Modal */}
      <Modal isOpen={closeOpen} onClose={() => setCloseOpen(false)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-danger-red rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-white text-2xl"
            />
          </div>
          <h3 className="text-xl font-bold mb-2">Close Table</h3>
          <p className="text-text-secondary mb-6">
            Are you sure you want to close table {selected?.id}?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setCloseOpen(false)}
              className="flex-1 border border-dark text-text-secondary py-3 rounded-xl font-semibold hover:bg-hover-bg"
            >
              Cancel
            </button>
            <button
              onClick={markClosed}
              className="flex-1 bg-danger-red hover:brightness-110 py-3 rounded-xl font-bold text-white"
            >
              Confirm Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Revenue Log Modal */}
      <Modal isOpen={revenueOpen} onClose={() => setRevenueOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Table Revenue - {selected?.name}
          </h3>
          <button
            onClick={() => setRevenueOpen(false)}
            className="text-text-secondary hover:text-white"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <select className="bg-primary-bg border border-dark rounded-xl px-4 py-2 text-white">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom Range</option>
          </select>
        </div>

        <UiTable>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead className="text-right">Buy-ins</TableHead>
              <TableHead className="text-right">Rake</TableHead>
              <TableHead className="text-right">Winnings</TableHead>
              <TableHead className="text-right">Net Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Dec 15, 2024</TableCell>
              <TableCell className="text-text-secondary">#S-4521</TableCell>
              <TableCell className="text-right">$45,000</TableCell>
              <TableCell className="text-right text-accent-green">
                $2,250
              </TableCell>
              <TableCell className="text-right">$42,750</TableCell>
              <TableCell className="text-right text-accent-green font-bold">
                $2,250
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dec 14, 2024</TableCell>
              <TableCell className="text-text-secondary">#S-4520</TableCell>
              <TableCell className="text-right">$38,000</TableCell>
              <TableCell className="text-right text-accent-green">
                $1,900
              </TableCell>
              <TableCell className="text-right">$36,100</TableCell>
              <TableCell className="text-right text-accent-green font-bold">
                $1,900
              </TableCell>
            </TableRow>
          </TableBody>
          <TableCaption>Recent sessions</TableCaption>
        </UiTable>

        <div className="border-t border-dark pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Total Revenue (7 days)</span>
            <span className="text-accent-green text-xl font-bold">
              {selected?.revenue ?? '$0'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
