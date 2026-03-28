import type { AppState, LearningMode, NotificationItem, UserProfile } from '@/types'
import { createSkill } from '@/data/skills'
import { hydrateState } from '@/utils/app'

const today = '2026-03-28T09:00:00.000Z'

function avatar(id: number) {
  return `https://i.pravatar.cc/300?img=${id}`
}

function user(
  profile: Omit<UserProfile, 'swapScore' | 'rating' | 'reviewCount' | 'completedSwaps' | 'taughtCount' | 'learnedCount' | 'reports'>,
) {
  return {
    ...profile,
    swapScore: 0,
    rating: 0,
    reviewCount: 0,
    completedSwaps: 0,
    taughtCount: 0,
    learnedCount: 0,
    reports: 0,
  } satisfies UserProfile
}

function note(
  id: string,
  userId: string,
  title: string,
  description: string,
  type: NotificationItem['type'],
  createdAt: string,
  link?: string,
) {
  return { id, userId, title, description, type, createdAt, link, read: false }
}

const avaOffered = [
  createSkill('skill-ava-guitar', 'Guitar', 'Music', 'Advanced'),
  createSkill('skill-ava-hindi', 'Hindi', 'Languages', 'Advanced'),
]
const avaWanted = [
  createSkill('skill-ava-python', 'Python', 'Tech', 'Beginner'),
  createSkill('skill-ava-yoga', 'Yoga', 'Wellness', 'Beginner'),
]

const rohanOffered = [
  createSkill('skill-rohan-python', 'Python', 'Tech', 'Advanced'),
  createSkill('skill-rohan-excel', 'Excel', 'Tech', 'Advanced'),
]
const rohanWanted = [
  createSkill('skill-rohan-guitar', 'Guitar', 'Music', 'Beginner'),
  createSkill('skill-rohan-speaking', 'Public Speaking', 'Business', 'Intermediate'),
]

const users = [
  user({
    id: 'user-ava',
    username: 'ava-shah',
    name: 'Ava Shah',
    email: 'ava@skillbridge.app',
    photo: avatar(32),
    city: 'Mumbai',
    bio: 'Weekend acoustic performer who wants to turn automation ideas into tiny Python projects.',
    age: 27,
    headline: 'Acoustic guitar mentor seeking Python accountability partner',
    availability: ['Weekends', 'Evenings'],
    mode: 'Both',
    joinedAt: today,
    badges: ['Host', 'Fast Responder'],
    skillsOffered: avaOffered,
    skillsWanted: avaWanted,
  }),
  user({
    id: 'user-rohan',
    username: 'rohan-mehta',
    name: 'Rohan Mehta',
    email: 'rohan@skillbridge.app',
    photo: avatar(12),
    city: 'Bengaluru',
    bio: 'Backend engineer who loves teaching Python fundamentals and wants to finally strum clean chords.',
    age: 30,
    headline: 'Python coach trading for guitar basics',
    availability: ['Weekdays', 'Evenings'],
    mode: 'Online',
    joinedAt: today,
    badges: ['Top Rated'],
    skillsOffered: rohanOffered,
    skillsWanted: rohanWanted,
  }),
  user({
    id: 'user-mia',
    username: 'mia-fernandes',
    name: 'Mia Fernandes',
    email: 'mia@skillbridge.app',
    photo: avatar(47),
    city: 'Goa',
    bio: 'Yoga instructor and retreat host hoping to practice conversational Hindi before the monsoon season.',
    age: 29,
    headline: 'Sunrise yoga teacher looking for Hindi conversation',
    availability: ['Weekdays', 'Weekends'],
    mode: 'Both',
    joinedAt: '2026-03-27T09:00:00.000Z',
    badges: ['Wellness Guide'],
    skillsOffered: [
      createSkill('skill-mia-yoga', 'Yoga', 'Wellness', 'Advanced'),
      createSkill('skill-mia-meditation', 'Meditation', 'Wellness', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-mia-hindi', 'Hindi', 'Languages', 'Intermediate'),
      createSkill('skill-mia-photo', 'Photography', 'Creative', 'Beginner'),
    ],
  }),
  user({
    id: 'user-sofia',
    username: 'sofia-alvarez',
    name: 'Sofia Alvarez',
    email: 'sofia@skillbridge.app',
    photo: avatar(41),
    city: 'Delhi',
    bio: 'Bilingual travel creator offering Spanish drills and camera basics in exchange for cooking confidence.',
    age: 31,
    headline: 'Spanish + photography swaps for home cooking',
    availability: ['Weekends', 'Evenings'],
    mode: 'Both',
    joinedAt: '2026-03-20T09:00:00.000Z',
    badges: ['Top Rated'],
    skillsOffered: [
      createSkill('skill-sofia-spanish', 'Spanish', 'Languages', 'Advanced'),
      createSkill('skill-sofia-photo', 'Photography', 'Creative', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-sofia-cooking', 'Cooking', 'Lifestyle', 'Beginner'),
      createSkill('skill-sofia-hindi', 'Hindi', 'Languages', 'Intermediate'),
    ],
  }),
  user({
    id: 'user-arjun',
    username: 'arjun-patel',
    name: 'Arjun Patel',
    email: 'arjun@skillbridge.app',
    photo: avatar(16),
    city: 'Pune',
    bio: 'Home baker with a weekend supper club. Wants to make cleaner fitness plans and stronger short-form edits.',
    age: 33,
    headline: 'Cooking mentor exploring video editing and fitness',
    availability: ['Weekends'],
    mode: 'In-person',
    joinedAt: '2026-03-16T09:00:00.000Z',
    badges: ['Chef Circle'],
    skillsOffered: [
      createSkill('skill-arjun-cooking', 'Cooking', 'Lifestyle', 'Advanced'),
      createSkill('skill-arjun-baking', 'Baking', 'Lifestyle', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-arjun-video', 'Video Editing', 'Creative', 'Beginner'),
      createSkill('skill-arjun-fitness', 'Fitness', 'Wellness', 'Beginner'),
    ],
  }),
  user({
    id: 'user-neha',
    username: 'neha-kapoor',
    name: 'Neha Kapoor',
    email: 'neha@skillbridge.app',
    photo: avatar(53),
    city: 'Jaipur',
    bio: 'Freelance editor offering reels and brand storytelling. Wants better personal finance systems and French basics.',
    age: 26,
    headline: 'Video editor trading edits for finance fluency',
    availability: ['Weekdays', 'Evenings'],
    mode: 'Online',
    joinedAt: '2026-03-14T09:00:00.000Z',
    badges: ['Creative Pro'],
    skillsOffered: [
      createSkill('skill-neha-video', 'Video Editing', 'Creative', 'Advanced'),
      createSkill('skill-neha-photo', 'Photography', 'Creative', 'Intermediate'),
    ],
    skillsWanted: [
      createSkill('skill-neha-finance', 'Finance', 'Business', 'Beginner'),
      createSkill('skill-neha-french', 'French', 'Languages', 'Beginner'),
    ],
  }),
  user({
    id: 'user-leo',
    username: 'leo-tanaka',
    name: 'Leo Tanaka',
    email: 'leo@skillbridge.app',
    photo: avatar(23),
    city: 'Tokyo',
    bio: 'Illustrator building a side career in remote workshops. Happy to swap Japanese and drawing for web dev or singing.',
    age: 28,
    headline: 'Illustrator swapping Japanese lessons for web builds',
    availability: ['Weekdays'],
    mode: 'Online',
    joinedAt: '2026-03-23T09:00:00.000Z',
    badges: ['Global Mentor'],
    skillsOffered: [
      createSkill('skill-leo-japanese', 'Japanese', 'Languages', 'Advanced'),
      createSkill('skill-leo-drawing', 'Drawing', 'Creative', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-leo-singing', 'Singing', 'Music', 'Beginner'),
      createSkill('skill-leo-webdev', 'Web Dev', 'Tech', 'Intermediate'),
    ],
  }),
  user({
    id: 'user-emma',
    username: 'emma-reed',
    name: 'Emma Reed',
    email: 'emma@skillbridge.app',
    photo: avatar(60),
    city: 'London',
    bio: 'Startup operator who enjoys helping people with pitch decks and public speaking. Wants a slower hobby in return.',
    age: 35,
    headline: 'Public speaking coach looking for piano or gardening',
    availability: ['Weekends', 'Evenings'],
    mode: 'Online',
    joinedAt: '2026-03-18T09:00:00.000Z',
    badges: ['Top Rated'],
    skillsOffered: [
      createSkill('skill-emma-speaking', 'Public Speaking', 'Business', 'Advanced'),
      createSkill('skill-emma-marketing', 'Marketing', 'Business', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-emma-gardening', 'Gardening', 'Lifestyle', 'Beginner'),
      createSkill('skill-emma-piano', 'Piano', 'Music', 'Beginner'),
    ],
  }),
  user({
    id: 'user-kavya',
    username: 'kavya-iyer',
    name: 'Kavya Iyer',
    email: 'kavya@skillbridge.app',
    photo: avatar(55),
    city: 'Chennai',
    bio: 'STEM tutor who can make physics feel approachable. Currently learning to market her own workshops.',
    age: 24,
    headline: 'Maths and physics tutor learning marketing',
    availability: ['Weekdays', 'Evenings'],
    mode: 'Both',
    joinedAt: today,
    badges: ['Academic Ace'],
    skillsOffered: [
      createSkill('skill-kavya-maths', 'Maths', 'Academic', 'Advanced'),
      createSkill('skill-kavya-physics', 'Physics', 'Academic', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-kavya-guitar', 'Guitar', 'Music', 'Beginner'),
      createSkill('skill-kavya-marketing', 'Marketing', 'Business', 'Beginner'),
    ],
  }),
  user({
    id: 'user-daniel',
    username: 'daniel-brooks',
    name: 'Daniel Brooks',
    email: 'daniel@skillbridge.app',
    photo: avatar(8),
    city: 'Toronto',
    bio: 'Product engineer mentoring people on web development. Wants meditation and better baking fundamentals.',
    age: 32,
    headline: 'Web dev mentor seeking meditation + baking swaps',
    availability: ['Weekends'],
    mode: 'Online',
    joinedAt: '2026-03-21T09:00:00.000Z',
    badges: ['Product Builder'],
    skillsOffered: [
      createSkill('skill-daniel-webdev', 'Web Dev', 'Tech', 'Advanced'),
      createSkill('skill-daniel-french', 'French', 'Languages', 'Intermediate'),
    ],
    skillsWanted: [
      createSkill('skill-daniel-meditation', 'Meditation', 'Wellness', 'Beginner'),
      createSkill('skill-daniel-baking', 'Baking', 'Lifestyle', 'Beginner'),
    ],
  }),
  user({
    id: 'user-priya',
    username: 'priya-sethi',
    name: 'Priya Sethi',
    email: 'priya@skillbridge.app',
    photo: avatar(58),
    city: 'Hyderabad',
    bio: 'Community runner and balcony gardener. Wants spreadsheet confidence and beginner Japanese phrases.',
    age: 29,
    headline: 'Fitness coach hunting for Excel and Japanese basics',
    availability: ['Weekdays', 'Weekends'],
    mode: 'Both',
    joinedAt: '2026-03-22T09:00:00.000Z',
    badges: ['Reliable Swap'],
    skillsOffered: [
      createSkill('skill-priya-fitness', 'Fitness', 'Wellness', 'Advanced'),
      createSkill('skill-priya-gardening', 'Gardening', 'Lifestyle', 'Intermediate'),
    ],
    skillsWanted: [
      createSkill('skill-priya-excel', 'Excel', 'Tech', 'Beginner'),
      createSkill('skill-priya-japanese', 'Japanese', 'Languages', 'Beginner'),
    ],
  }),
  user({
    id: 'user-omar',
    username: 'omar-hassan',
    name: 'Omar Hassan',
    email: 'omar@skillbridge.app',
    photo: avatar(10),
    city: 'Dubai',
    bio: 'Finance analyst who enjoys coaching job switchers. Looking for stronger video editing and yoga habits.',
    age: 34,
    headline: 'Finance mentor trading for yoga and video editing',
    availability: ['Weekdays', 'Evenings'],
    mode: 'Online',
    joinedAt: '2026-03-10T09:00:00.000Z',
    badges: ['Top Rated'],
    skillsOffered: [
      createSkill('skill-omar-finance', 'Finance', 'Business', 'Advanced'),
      createSkill('skill-omar-english', 'English', 'Academic', 'Advanced'),
    ],
    skillsWanted: [
      createSkill('skill-omar-video', 'Video Editing', 'Creative', 'Intermediate'),
      createSkill('skill-omar-yoga', 'Yoga', 'Wellness', 'Beginner'),
    ],
  }),
] satisfies UserProfile[]

const swapRequests = [
  {
    id: 'swap-ava-rohan',
    senderId: 'user-ava',
    receiverId: 'user-rohan',
    message:
      'You teach Python and want guitar. I can trade beginner-friendly chord sessions for Python accountability.',
    status: 'Accepted',
    createdAt: '2026-03-28T08:00:00.000Z',
    updatedAt: '2026-03-28T10:00:00.000Z',
    offeredSkillId: 'skill-ava-guitar',
    wantedSkillId: 'skill-ava-python',
    completedBy: [],
  },
  {
    id: 'swap-mia-ava',
    senderId: 'user-mia',
    receiverId: 'user-ava',
    message:
      'I can do weekday online yoga sessions if you help me feel more natural speaking Hindi.',
    status: 'Pending',
    createdAt: '2026-03-28T11:20:00.000Z',
    updatedAt: '2026-03-28T11:20:00.000Z',
    offeredSkillId: 'skill-mia-yoga',
    wantedSkillId: 'skill-mia-hindi',
    completedBy: [],
  },
  {
    id: 'swap-ava-daniel',
    senderId: 'user-ava',
    receiverId: 'user-daniel',
    message: 'Would love to trade Hindi conversation for meditation basics.',
    status: 'Declined',
    createdAt: '2026-03-25T07:00:00.000Z',
    updatedAt: '2026-03-25T08:00:00.000Z',
    offeredSkillId: 'skill-ava-hindi',
    wantedSkillId: 'skill-ava-yoga',
    completedBy: [],
  },
  {
    id: 'swap-priya-rohan',
    senderId: 'user-priya',
    receiverId: 'user-rohan',
    message: 'Can we swap Excel lessons for a simple fitness plan?',
    status: 'Completed',
    createdAt: '2026-03-12T10:00:00.000Z',
    updatedAt: '2026-03-18T17:00:00.000Z',
    offeredSkillId: 'skill-priya-fitness',
    wantedSkillId: 'skill-priya-excel',
    completedBy: ['user-priya', 'user-rohan'],
  },
  {
    id: 'swap-neha-omar',
    senderId: 'user-neha',
    receiverId: 'user-omar',
    message:
      'Happy to help you with reels and transitions if you can break down budgeting for freelancers.',
    status: 'Accepted',
    createdAt: '2026-03-26T09:30:00.000Z',
    updatedAt: '2026-03-27T12:00:00.000Z',
    offeredSkillId: 'skill-neha-video',
    wantedSkillId: 'skill-neha-finance',
    completedBy: [],
  },
  {
    id: 'swap-sofia-arjun',
    senderId: 'user-sofia',
    receiverId: 'user-arjun',
    message: 'You cook, I teach Spanish. Could be a fun Sunday swap.',
    status: 'Completed',
    createdAt: '2026-03-10T12:00:00.000Z',
    updatedAt: '2026-03-22T12:00:00.000Z',
    offeredSkillId: 'skill-sofia-spanish',
    wantedSkillId: 'skill-sofia-cooking',
    completedBy: ['user-sofia', 'user-arjun'],
  },
] as AppState['swapRequests']

const messages = [
  {
    id: 'msg-1',
    swapRequestId: 'swap-ava-rohan',
    senderId: 'user-rohan',
    message: 'Accepted. Want to do our first 30-minute swap on Saturday evening?',
    timestamp: '2026-03-28T10:05:00.000Z',
    type: 'text',
  },
  {
    id: 'msg-2',
    swapRequestId: 'swap-ava-rohan',
    senderId: 'user-ava',
    message: 'Session scheduled: Saturday 7 PM IST. I will share a Google Meet link.',
    timestamp: '2026-03-28T10:06:00.000Z',
    type: 'template',
  },
  {
    id: 'msg-3',
    swapRequestId: 'swap-ava-rohan',
    senderId: 'user-ava',
    message: 'Here is the meeting link: https://meet.google.com/xyz-demo-room',
    timestamp: '2026-03-28T10:07:00.000Z',
    type: 'text',
  },
  {
    id: 'msg-4',
    swapRequestId: 'swap-neha-omar',
    senderId: 'user-neha',
    message: 'I made a short Loom with video notes. Want me to send it before we meet?',
    timestamp: '2026-03-27T12:10:00.000Z',
    type: 'text',
  },
] as AppState['messages']

const reviews = [
  {
    id: 'review-1',
    reviewerId: 'user-rohan',
    revieweeId: 'user-priya',
    swapRequestId: 'swap-priya-rohan',
    rating: 5,
    comment: 'Priya made the workout plan approachable and consistent.',
    createdAt: '2026-03-18T18:00:00.000Z',
  },
  {
    id: 'review-2',
    reviewerId: 'user-priya',
    revieweeId: 'user-rohan',
    swapRequestId: 'swap-priya-rohan',
    rating: 5,
    comment: 'Great Excel teacher. Patient and structured.',
    createdAt: '2026-03-18T18:10:00.000Z',
  },
  {
    id: 'review-3',
    reviewerId: 'user-arjun',
    revieweeId: 'user-sofia',
    swapRequestId: 'swap-sofia-arjun',
    rating: 5,
    comment: 'Spanish practice felt natural and fun.',
    createdAt: '2026-03-22T12:30:00.000Z',
  },
  {
    id: 'review-4',
    reviewerId: 'user-sofia',
    revieweeId: 'user-arjun',
    swapRequestId: 'swap-sofia-arjun',
    rating: 4,
    comment: 'Cooking session was warm, practical, and delicious.',
    createdAt: '2026-03-22T12:35:00.000Z',
  },
  {
    id: 'review-5',
    reviewerId: 'user-neha',
    revieweeId: 'user-omar',
    swapRequestId: 'swap-neha-omar',
    rating: 5,
    comment: 'Crisp finance frameworks and generous advice.',
    createdAt: '2026-03-28T12:20:00.000Z',
  },
  {
    id: 'review-6',
    reviewerId: 'user-sofia',
    revieweeId: 'user-emma',
    swapRequestId: 'swap-sofia-arjun',
    rating: 5,
    comment: 'Emma reviewed my intro deck and made it instantly clearer.',
    createdAt: '2026-03-20T12:00:00.000Z',
  },
] as AppState['reviews']

const notifications = [
  note(
    'notification-1',
    'user-ava',
    'New swap request from Mia',
    'Yoga for Hindi conversation. This one is a perfect reciprocal match.',
    'request',
    '2026-03-28T11:22:00.000Z',
    '/dashboard',
  ),
  note(
    'notification-2',
    'user-ava',
    'Daily matches ready',
    'Rohan, Mia, and Omar fit your current learning goals.',
    'match',
    '2026-03-28T07:15:00.000Z',
    '/explore',
  ),
  note(
    'notification-3',
    'user-rohan',
    'Ava accepted the session time',
    'Saturday 7 PM IST is locked in.',
    'chat',
    '2026-03-28T10:07:00.000Z',
    '/chat/swap-ava-rohan',
  ),
] as AppState['notifications']

const posts = [
  {
    id: 'post-1',
    userId: 'user-kavya',
    skillName: 'Marketing',
    category: 'Business',
    note: 'Looking for help positioning my STEM bootcamp for parents and students.',
    city: 'Chennai',
    mode: 'Online',
    createdAt: today,
    responses: 3,
  },
  {
    id: 'post-2',
    userId: 'user-priya',
    skillName: 'Japanese',
    category: 'Languages',
    note: 'Need survival phrases before a summer trip. Happy to trade running plans.',
    city: 'Hyderabad',
    mode: 'Both',
    createdAt: '2026-03-27T10:00:00.000Z',
    responses: 5,
  },
  {
    id: 'post-3',
    userId: 'user-arjun',
    skillName: 'Video Editing',
    category: 'Creative',
    note: 'Want to edit short recipe reels without spending hours in the timeline.',
    city: 'Pune',
    mode: 'Online',
    createdAt: '2026-03-26T10:00:00.000Z',
    responses: 2,
  },
] as AppState['posts']

export function getSeedState(theme: AppState['theme'] = 'light') {
  return hydrateState({
    users,
    swapRequests,
    messages,
    reviews,
    notifications,
    posts,
    auth: {
      currentUserId: null,
      provider: null,
      mode: 'demo',
    },
    theme,
    lastSuggestionDate: null,
  })
}

export const demoCredentials = {
  email: 'ava@skillbridge.app',
  password: 'demo-pass',
}

export const availabilityOptions: AppState['users'][number]['availability'] = [
  'Weekdays',
  'Weekends',
  'Evenings',
]

export const modeOptions: LearningMode[] = ['Online', 'In-person', 'Both']
