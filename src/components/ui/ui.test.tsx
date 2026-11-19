// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { Switch } from './Switch';
import { Tabs } from './Tabs';
import { UserAvatar } from './UserAvatar';

afterEach(cleanup);
it('derives readable initials for a user', () => { render(<UserAvatar name="Mira Stone" />); expect(screen.getByLabelText('Mira Stone').textContent).toBe('MS'); });
it('shows a fallback for an empty name', () => { render(<UserAvatar name="" />); expect(screen.getByText('?')).toBeTruthy(); });
it('exposes status text in badges', () => { render(<Badge>ready</Badge>); expect(screen.getByText('ready')).toBeTruthy(); });
it('exposes ingestion progress', () => { render(<ProgressBar aria-label="Ingestion" value={0.5} />); expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(0.5); });
it('renders an accessible switch', () => { render(<Switch aria-label="Captions" defaultChecked />); expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true); });
it('supports keyboard navigation between tabs', () => { render(<Tabs label="Views" items={[{label:'First',content:'One'},{label:'Second',content:'Two'}]} />); fireEvent.keyDown(screen.getByRole('tab', {name:'First'}), {key:'ArrowRight'}); expect(screen.getByRole('tab', {name:'Second'}).getAttribute('aria-selected')).toBe('true'); expect(screen.getByRole('tabpanel').textContent).toBe('Two'); });
