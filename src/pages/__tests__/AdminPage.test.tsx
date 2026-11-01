import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminPage } from '../AdminPage'
import type { UserProfile } from '@/types'

const mockCurrentUser: UserProfile = {
  id: 'user-1',
  name: 'Regular User',
  email: 'regular@admin.com', // Has @admin in email, but NOT an admin!
  username: 'regular',
  photo: '',
  city: 'SF',
  bio: '',
  headline: '',
  availability: [],
  mode: 'Online',
  joinedAt: '2026-01-01',
  lastActiveAt: '2026-01-01',
  swapScore: 0,
  rating: 5,
  reviewCount: 0,
  completedSwaps: 0,
  taughtCount: 0,
  learnedCount: 0,
  badges: [],
  skillsOffered: [],
  skillsWanted: [],
  reports: 0,
}

let mockAppUser: UserProfile | null = mockCurrentUser

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentUser: mockAppUser,
    state: { users: [] },
    ensureUsersLoaded: vi.fn(),
  }),
}))

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-1', app_metadata: { role: 'user' } } },
})

const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
    order: vi.fn(() => ({
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })),
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => mockFrom(),
  },
  isSupabaseConfigured: true,
}))

describe('AdminPage Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAppUser = mockCurrentUser
  })

  it('denies access to users with @admin in email when role is not admin', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', app_metadata: { role: 'user' } } },
    })

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument()
    })
  })

  it('grants access when user has app_metadata role admin', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', app_metadata: { role: 'admin' } } },
    })

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Console Center')).toBeInTheDocument()
      expect(screen.getByText('Abuse Reports')).toBeInTheDocument()
    })
  })

  it('grants access when user is verified in admin_users database table', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-2', app_metadata: {} } },
    })

    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'user-2' } }),
        })),
      })),
    } as unknown as ReturnType<typeof mockFrom>)

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Console Center')).toBeInTheDocument()
    })
  })
})
