insert into public.users (
  id,
  username,
  name,
  email,
  photo,
  city,
  bio,
  headline,
  age,
  availability,
  mode,
  swap_score,
  rating,
  review_count,
  completed_swaps,
  taught_count,
  learned_count,
  reports
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'ava-shah',
    'Ava Shah',
    'ava@skillbridge.app',
    'https://i.pravatar.cc/300?img=32',
    'Mumbai',
    'Weekend acoustic performer who wants to turn automation ideas into tiny Python projects.',
    'Acoustic guitar mentor seeking Python accountability partner',
    27,
    array['Weekends', 'Evenings'],
    'Both',
    92,
    4.9,
    4,
    2,
    2,
    2,
    0
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'rohan-mehta',
    'Rohan Mehta',
    'rohan@skillbridge.app',
    'https://i.pravatar.cc/300?img=12',
    'Bengaluru',
    'Backend engineer who loves teaching Python fundamentals and wants to finally strum clean chords.',
    'Python coach trading for guitar basics',
    30,
    array['Weekdays', 'Evenings'],
    'Online',
    95,
    5.0,
    3,
    1,
    1,
    1,
    0
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'mia-fernandes',
    'Mia Fernandes',
    'mia@skillbridge.app',
    'https://i.pravatar.cc/300?img=47',
    'Goa',
    'Yoga instructor and retreat host hoping to practice conversational Hindi before the monsoon season.',
    'Sunrise yoga teacher looking for Hindi conversation',
    29,
    array['Weekdays', 'Weekends'],
    'Both',
    84,
    4.7,
    2,
    1,
    1,
    1,
    0
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'sofia-alvarez',
    'Sofia Alvarez',
    'sofia@skillbridge.app',
    'https://i.pravatar.cc/300?img=41',
    'Delhi',
    'Bilingual travel creator offering Spanish drills and camera basics in exchange for cooking confidence.',
    'Spanish + photography swaps for home cooking',
    31,
    array['Weekends', 'Evenings'],
    'Both',
    90,
    4.8,
    2,
    1,
    1,
    1,
    0
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'arjun-patel',
    'Arjun Patel',
    'arjun@skillbridge.app',
    'https://i.pravatar.cc/300?img=16',
    'Pune',
    'Home baker with a weekend supper club. Wants to make cleaner fitness plans and stronger short-form edits.',
    'Cooking mentor exploring video editing and fitness',
    33,
    array['Weekends'],
    'In-person',
    81,
    4.4,
    1,
    1,
    1,
    1,
    0
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'neha-kapoor',
    'Neha Kapoor',
    'neha@skillbridge.app',
    'https://i.pravatar.cc/300?img=53',
    'Jaipur',
    'Freelance editor offering reels and brand storytelling. Wants better personal finance systems and French basics.',
    'Video editor trading edits for finance fluency',
    26,
    array['Weekdays', 'Evenings'],
    'Online',
    88,
    4.9,
    1,
    1,
    1,
    1,
    0
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'leo-tanaka',
    'Leo Tanaka',
    'leo@skillbridge.app',
    'https://i.pravatar.cc/300?img=23',
    'Tokyo',
    'Illustrator building a side career in remote workshops. Happy to swap Japanese and drawing for web dev or singing.',
    'Illustrator swapping Japanese lessons for web builds',
    28,
    array['Weekdays'],
    'Online',
    79,
    4.5,
    1,
    0,
    0,
    0,
    0
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'emma-reed',
    'Emma Reed',
    'emma@skillbridge.app',
    'https://i.pravatar.cc/300?img=60',
    'London',
    'Startup operator who enjoys helping people with pitch decks and public speaking. Wants a slower hobby in return.',
    'Public speaking coach looking for piano or gardening',
    35,
    array['Weekends', 'Evenings'],
    'Online',
    89,
    5.0,
    1,
    0,
    0,
    0,
    0
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'kavya-iyer',
    'Kavya Iyer',
    'kavya@skillbridge.app',
    'https://i.pravatar.cc/300?img=55',
    'Chennai',
    'STEM tutor who can make physics feel approachable. Currently learning to market her own workshops.',
    'Maths and physics tutor learning marketing',
    24,
    array['Weekdays', 'Evenings'],
    'Both',
    83,
    4.6,
    1,
    0,
    0,
    0,
    0
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'daniel-brooks',
    'Daniel Brooks',
    'daniel@skillbridge.app',
    'https://i.pravatar.cc/300?img=8',
    'Toronto',
    'Product engineer mentoring people on web development. Wants meditation and better baking fundamentals.',
    'Web dev mentor seeking meditation + baking swaps',
    32,
    array['Weekends'],
    'Online',
    80,
    4.4,
    1,
    0,
    0,
    0,
    0
  );

insert into public.skills_offered (id, user_id, skill_name, category, level)
values
  ('10111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Guitar', 'Music', 'Advanced'),
  ('10111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Hindi', 'Languages', 'Advanced'),
  ('20222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Python', 'Tech', 'Advanced'),
  ('20222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Excel', 'Tech', 'Advanced'),
  ('30333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Yoga', 'Wellness', 'Advanced'),
  ('30333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Meditation', 'Wellness', 'Advanced'),
  ('40444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Spanish', 'Languages', 'Advanced'),
  ('40444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', 'Photography', 'Creative', 'Advanced'),
  ('50555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'Cooking', 'Lifestyle', 'Advanced'),
  ('50555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'Baking', 'Lifestyle', 'Advanced'),
  ('60666666-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666666', 'Video Editing', 'Creative', 'Advanced'),
  ('60666666-6666-6666-6666-666666666662', '66666666-6666-6666-6666-666666666666', 'Photography', 'Creative', 'Intermediate'),
  ('70777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777777', 'Japanese', 'Languages', 'Advanced'),
  ('70777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777777', 'Drawing', 'Creative', 'Advanced'),
  ('80888888-8888-8888-8888-888888888881', '88888888-8888-8888-8888-888888888888', 'Public Speaking', 'Business', 'Advanced'),
  ('80888888-8888-8888-8888-888888888882', '88888888-8888-8888-8888-888888888888', 'Marketing', 'Business', 'Advanced'),
  ('90999999-9999-9999-9999-999999999991', '99999999-9999-9999-9999-999999999999', 'Maths', 'Academic', 'Advanced'),
  ('90999999-9999-9999-9999-999999999992', '99999999-9999-9999-9999-999999999999', 'Physics', 'Academic', 'Advanced'),
  ('10aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Web Dev', 'Tech', 'Advanced'),
  ('10aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'French', 'Languages', 'Intermediate');

insert into public.skills_wanted (id, user_id, skill_name, category)
values
  ('11110000-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Python', 'Tech'),
  ('11110000-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Yoga', 'Wellness'),
  ('22220000-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Guitar', 'Music'),
  ('22220000-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Public Speaking', 'Business'),
  ('33330000-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Hindi', 'Languages'),
  ('33330000-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Photography', 'Creative'),
  ('44440000-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Cooking', 'Lifestyle'),
  ('44440000-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', 'Hindi', 'Languages'),
  ('55550000-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'Video Editing', 'Creative'),
  ('55550000-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'Fitness', 'Wellness'),
  ('66660000-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666666', 'Finance', 'Business'),
  ('66660000-6666-6666-6666-666666666662', '66666666-6666-6666-6666-666666666666', 'French', 'Languages'),
  ('77770000-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777777', 'Web Dev', 'Tech'),
  ('77770000-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777777', 'Singing', 'Music'),
  ('88880000-8888-8888-8888-888888888881', '88888888-8888-8888-8888-888888888888', 'Gardening', 'Lifestyle'),
  ('88880000-8888-8888-8888-888888888882', '88888888-8888-8888-8888-888888888888', 'Piano', 'Music'),
  ('99990000-9999-9999-9999-999999999991', '99999999-9999-9999-9999-999999999999', 'Guitar', 'Music'),
  ('99990000-9999-9999-9999-999999999992', '99999999-9999-9999-9999-999999999999', 'Marketing', 'Business'),
  ('aaaab000-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Meditation', 'Wellness'),
  ('aaaab000-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Baking', 'Lifestyle');

insert into public.swap_requests (
  id,
  sender_id,
  receiver_id,
  message,
  offered_skill_id,
  wanted_skill_id,
  status,
  completed_by,
  created_at,
  updated_at
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'You teach Python and want guitar. I can trade beginner-friendly chord sessions for Python accountability.',
    '10111111-1111-1111-1111-111111111111',
    '11110000-1111-1111-1111-111111111111',
    'Accepted',
    array[]::uuid[],
    '2026-03-28T08:00:00Z',
    '2026-03-28T10:00:00Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'I can do weekday online yoga sessions if you help me feel more natural speaking Hindi.',
    '30333333-3333-3333-3333-333333333331',
    '33330000-3333-3333-3333-333333333331',
    'Pending',
    array[]::uuid[],
    '2026-03-28T11:20:00Z',
    '2026-03-28T11:20:00Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    'You cook, I teach Spanish. Could be a fun Sunday swap.',
    '40444444-4444-4444-4444-444444444441',
    '44440000-4444-4444-4444-444444444441',
    'Completed',
    array['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555']::uuid[],
    '2026-03-10T12:00:00Z',
    '2026-03-22T12:00:00Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Happy to help you with reels and transitions if you can break down budgeting for freelancers.',
    '60666666-6666-6666-6666-666666666661',
    '66660000-6666-6666-6666-666666666661',
    'Accepted',
    array[]::uuid[],
    '2026-03-26T09:30:00Z',
    '2026-03-27T12:00:00Z'
  );

insert into public.connection_requests (
  id,
  sender_id,
  receiver_id,
  message,
  status,
  created_at,
  updated_at
)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888888',
    'Your mentoring style looks like a great fit. Want to connect directly on SkillBridge?',
    'Accepted',
    '2026-03-27T08:30:00Z',
    '2026-03-27T09:10:00Z'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    'Would love to connect about workshop marketing when you have time.',
    'Pending',
    '2026-03-28T06:45:00Z',
    '2026-03-28T06:45:00Z'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'I think we could help each other beyond a single swap. Want to stay connected?',
    'Accepted',
    '2026-03-27T13:00:00Z',
    '2026-03-27T13:35:00Z'
  );

insert into public.chats (
  thread_key,
  swap_id,
  connection_request_id,
  sender_id,
  receiver_id,
  message,
  message_type,
  created_at
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    null,
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Accepted. Want to do our first 30-minute swap on Saturday evening?',
    'text',
    '2026-03-28T10:05:00Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    null,
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Session scheduled: Saturday 7 PM IST. I will share a Google Meet link.',
    'template',
    '2026-03-28T10:06:00Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    null,
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Here is the meeting link: https://meet.google.com/xyz-demo-room',
    'text',
    '2026-03-28T10:07:00Z'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    null,
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '88888888-8888-8888-8888-888888888888',
    '11111111-1111-1111-1111-111111111111',
    'Happy to connect. Let us compare learning goals and see where a swap might emerge.',
    'text',
    '2026-03-27T09:15:00Z'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    null,
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '66666666-6666-6666-6666-666666666666',
    'Direct connection unlocked. I can help on product structure whenever you want to jam on ideas.',
    'text',
    '2026-03-27T13:40:00Z'
  );

insert into public.reviews (reviewer_id, reviewee_id, swap_id, rating, comment, created_at)
values
  (
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    5,
    'Spanish practice felt natural and fun.',
    '2026-03-22T12:30:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    4,
    'Cooking session was warm, practical, and delicious.',
    '2026-03-22T12:35:00Z'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    5,
    'Crisp finance frameworks and generous advice.',
    '2026-03-28T12:20:00Z'
  );

insert into public.notifications (user_id, type, title, description, link, read, created_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'request',
    'New swap request from Mia',
    'Yoga for Hindi conversation. This one is a perfect reciprocal match.',
    '/dashboard',
    false,
    '2026-03-28T11:22:00Z'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'match',
    'Daily matches ready',
    'Rohan, Mia, and Daniel fit your current learning goals.',
    '/explore',
    false,
    '2026-03-28T07:15:00Z'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'connection',
    'Emma accepted your connection',
    'Direct messaging is now unlocked.',
    '/messages/cccccccc-cccc-cccc-cccc-ccccccccccc1',
    false,
    '2026-03-27T09:12:00Z'
  );

insert into public.looking_for_posts (user_id, skill_name, category, note, city, mode, responses, created_at)
values
  (
    '99999999-9999-9999-9999-999999999999',
    'Marketing',
    'Business',
    'Looking for help positioning my STEM bootcamp for parents and students.',
    'Chennai',
    'Online',
    3,
    '2026-03-28T09:00:00Z'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Video Editing',
    'Creative',
    'Want to edit short recipe reels without spending hours in the timeline.',
    'Pune',
    'Online',
    2,
    '2026-03-26T10:00:00Z'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Yoga',
    'Wellness',
    'Looking for a beginner-friendly yoga accountability partner with a music swap in return.',
    'Mumbai',
    'Both',
    4,
    '2026-03-28T10:30:00Z'
  );
