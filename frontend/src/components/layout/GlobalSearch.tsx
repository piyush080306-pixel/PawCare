import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  HeartHandshake,
  PawPrint,
  Search,
  Users,
  X,
} from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useAdoptions, useAnimals, useStaff } from '@/services/api/queries';
import { useUiStore } from '@/store/ui';
import { animalSubtitle, cn } from '@/utils/format';

interface Result {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  to: string;
  icon: ReactNode;
}

export function GlobalSearch() {
  const open = useUiStore(state => state.searchOpen);
  const setOpen = useUiStore(state => state.setSearchOpen);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: animals = [] } = useAnimals();
  const { data: staff = [] } = useStaff();
  const { data: adoptions = [] } = useAdoptions();

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();
    const matches = (value: string) => !needle || value.toLowerCase().includes(needle);

    const animalResults: Result[] = animals
      .filter(animal => matches(`${animal.name} ${animal.id} ${animal.category} ${animal.breed ?? ''}`))
      .slice(0, 6)
      .map(animal => ({
        id: `animal-${animal.id}`,
        group: 'Animals',
        title: animal.name,
        subtitle: `#${animal.id} · ${animalSubtitle(animal)} · ${animal.isAdopted ? 'Adopted' : 'Available'}`,
        to: `/animals/${animal.id}`,
        icon: <PawPrint className="h-4 w-4 text-brand" />,
      }));

    const staffResults: Result[] = staff
      .filter(member => matches(`${member.name} ${member.id} ${member.role} ${member.contactNumber}`))
      .slice(0, 5)
      .map(member => ({
        id: `staff-${member.id}`,
        group: 'Staff',
        title: member.name,
        subtitle: `#${member.id} · ${member.role.replace('_', ' ').toLowerCase()} · ${member.contactNumber}`,
        to: `/staff?member=${member.id}`,
        icon: <Users className="h-4 w-4 text-info" />,
      }));

    const applicationResults: Result[] = adoptions
      .filter(item => matches(`${item.id} ${item.animalName} ${item.adopterName} ${item.status}`))
      .slice(0, 6)
      .map(item => ({
        id: `adoption-${item.id}`,
        group: item.status === 'APPROVED' ? 'Adoption records' : 'Applications',
        title: `${item.animalName} · ${item.adopterName}`,
        subtitle: `#${item.id} · ${item.status.toLowerCase()} · ${item.date}`,
        to: `/adoptions/${item.id}`,
        icon:
          item.status === 'APPROVED' ? (
            <HeartHandshake className="h-4 w-4 text-success" />
          ) : (
            <ClipboardList className="h-4 w-4 text-warning" />
          ),
      }));

    return [...animalResults, ...applicationResults, ...staffResults];
  }, [animals, adoptions, query, staff]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const go = (result: Result) => {
    setOpen(false);
    navigate(result.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(index => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active]);
    }
  };

  let lastGroup = '';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#101a13]/50 backdrop-blur-sm animate-overlay-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-[71] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-float animate-dialog-in focus:outline-none"
        >
          <Dialog.Title className="sr-only">Global search</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="h-4 w-4 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search animals, staff, applications…"
              className="h-14 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
            />
            <Dialog.Close asChild>
              <button type="button" className="icon-button" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-muted">
                No matches for “{query}”.
              </p>
            ) : (
              results.map((result, index) => {
                const showGroup = result.group !== lastGroup;
                lastGroup = result.group;
                return (
                  <div key={result.id}>
                    {showGroup ? (
                      <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {result.group}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(result)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition',
                        index === active ? 'bg-brand-soft' : 'hover:bg-subtle',
                      )}
                    >
                      {result.icon}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {result.title}
                        </span>
                        <span className="block truncate text-[11px] text-muted">
                          {result.subtitle}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-line bg-subtle/60 px-4 py-2 text-[10px] text-muted">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navigate
            <span className="kbd">↵</span> open
            <span className="ml-auto">Search uses live records</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
