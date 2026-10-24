// Demo data for `npm run seed`. docs/TEST_ACCOUNTS.md is generated from this file
// (`npm run docs:accounts`), so edit here and regenerate rather than editing the doc.

export const DEMO_PASSWORD = 'password123';

// Users are inserted in this order, so ids are 1..n in a freshly seeded database.
export const users = [
  { key: 'mark', name: 'Mark Lee', sex: 'Male', birthday: '2002-05-14', hometown: 'Dobbs Ferry, NY', relationship_status: 'Single', interests: 'Coding, fencing, the classics', about_me: 'Building things in my dorm room.' },
  { key: 'sara', name: 'Sara Chen', sex: 'Female', birthday: '2002-09-03', hometown: 'San Francisco, CA', relationship_status: 'In a relationship', interests: 'Photography, hiking', about_me: 'Always up for a road trip.' },
  { key: 'omar', name: 'Omar Haddad', sex: 'Male', birthday: '2001-12-21', hometown: 'Beirut, Lebanon', relationship_status: 'Single', interests: 'Football, chess, falafel', about_me: 'CS major. Ask me about chess.' },
  { key: 'emma', name: 'Emma Brown', sex: 'Female', birthday: '2003-02-11', hometown: 'Boston, MA', relationship_status: "It's complicated", interests: 'Music, theater', about_me: 'Lead vocals in a band nobody has heard of (yet).' },
  { key: 'liam', name: 'Liam Walsh', sex: 'Male', birthday: '2002-07-30', hometown: 'Dublin, Ireland', relationship_status: 'Single', interests: 'Rugby, guitar, coffee', about_me: 'Exchange student. Will trade tea for coffee.' },
  { key: 'noah', name: 'Noah Kim', sex: 'Male', birthday: '2002-03-19', hometown: 'Seoul, South Korea', relationship_status: 'In a relationship', interests: 'Drums, video games', about_me: 'Drummer in Emma’s band.' },
  { key: 'olivia', name: 'Olivia Martin', sex: 'Female', birthday: '2001-10-08', hometown: 'Lyon, France', relationship_status: 'Single', interests: 'Painting, cooking, cinema', about_me: 'Art history + bad puns.' },
  { key: 'ava', name: 'Ava Rossi', sex: 'Female', birthday: '2003-01-25', hometown: 'Milan, Italy', relationship_status: 'Engaged', interests: 'Fashion, tennis', about_me: 'Tennis captain.' },
  { key: 'lucas', name: 'Lucas Silva', sex: 'Male', birthday: '2002-11-02', hometown: 'São Paulo, Brazil', relationship_status: 'Single', interests: 'Football, samba, startups', about_me: 'Pitching a startup every week.' },
  { key: 'mia', name: 'Mia Schmidt', sex: 'Female', birthday: '2002-04-17', hometown: 'Berlin, Germany', relationship_status: 'Single', interests: 'Techno, cycling, physics', about_me: 'Physics lab by day, DJ by night.' },
  { key: 'yusuf', name: 'Yusuf Demir', sex: 'Male', birthday: '2001-08-12', hometown: 'Istanbul, Turkey', relationship_status: 'Married', interests: 'History, basketball', about_me: 'Grad student in history.' },
  { key: 'layla', name: 'Layla Nasser', sex: 'Female', birthday: '2002-06-06', hometown: 'Amman, Jordan', relationship_status: 'Single', interests: 'Poetry, architecture', about_me: 'Architecture student who writes poems.' },
  { key: 'hana', name: 'Hana Sato', sex: 'Female', birthday: '2003-03-03', hometown: 'Osaka, Japan', relationship_status: 'Single', interests: 'Anime, baking, chess', about_me: 'Will beat you at chess. Then bake you a cake.' },
  { key: 'diego', name: 'Diego García', sex: 'Male', birthday: '2002-12-12', hometown: 'Madrid, Spain', relationship_status: 'In a relationship', interests: 'Football, film, guitar', about_me: 'Real Madrid forever.' },
  { key: 'sofia', name: 'Sofía López', sex: 'Female', birthday: '2002-10-21', hometown: 'Mexico City, Mexico', relationship_status: 'In a relationship', interests: 'Dance, languages', about_me: 'Speaks four languages, dances in all of them.' },
  { key: 'james', name: 'James Carter', sex: 'Male', birthday: '2001-09-09', hometown: 'Austin, TX', relationship_status: 'Single', interests: 'Debate, BBQ, running', about_me: 'Debate team. Will argue either side.' },
  { key: 'chloe', name: 'Chloe Dubois', sex: 'Female', birthday: '2003-05-27', hometown: 'Montreal, Canada', relationship_status: 'Single', interests: 'Hockey, journalism', about_me: 'Writing for the student paper.' },
  { key: 'ali', name: 'Ali Rahimi', sex: 'Male', birthday: '2002-02-02', hometown: 'Tehran, Iran', relationship_status: 'Single', interests: 'Math, volleyball', about_me: 'Math olympiad alum.' },
  { key: 'nina', name: 'Nina Petrova', sex: 'Female', birthday: '2002-08-18', hometown: 'Sofia, Bulgaria', relationship_status: 'Single', interests: 'Ballet, chess, travel', about_me: 'Ballet and chess. Both need good footwork.' },
  { key: 'ben', name: 'Ben Turner', sex: 'Male', birthday: '2003-07-07', hometown: 'Leeds, UK', relationship_status: '', interests: '', about_me: 'Just joined!' },
];

export const emailFor = (key) => `${key}@chatbook.test`;

// Accepted friendships (undirected).
export const friendships = [
  ['mark', 'sara'], ['mark', 'omar'], ['mark', 'liam'], ['mark', 'chloe'], ['mark', 'james'],
  ['sara', 'omar'], ['sara', 'emma'], ['sara', 'olivia'], ['sara', 'mia'],
  ['omar', 'yusuf'], ['omar', 'layla'], ['omar', 'ali'], ['omar', 'hana'],
  ['emma', 'liam'], ['emma', 'noah'], ['emma', 'chloe'],
  ['liam', 'noah'], ['liam', 'james'],
  ['olivia', 'ava'], ['olivia', 'mia'], ['ava', 'mia'],
  ['lucas', 'diego'], ['lucas', 'sofia'], ['lucas', 'mia'], ['diego', 'sofia'],
  ['yusuf', 'layla'], ['yusuf', 'ali'], ['layla', 'hana'],
  ['hana', 'nina'], ['nina', 'sofia'],
  ['james', 'chloe'],
];

// Pending friend requests: [from, to].
export const pendingRequests = [
  ['emma', 'mark'], ['ava', 'mark'], ['nina', 'mark'],
  ['mark', 'diego'],
  ['noah', 'sara'],
  ['chloe', 'olivia'],
  ['ben', 'omar'], ['ben', 'layla'],
];

// Wall posts: [author, wall owner, text, minutes ago]. author === wall owner is a status update.
export const posts = [
  ['mark', 'mark', 'is excited to launch this thing.', 4000],
  ['sara', 'mark', 'Congrats on the launch! 🎉', 3900],
  ['omar', 'sara', 'Chess rematch this weekend?', 2000],
  ['sara', 'sara', 'just got back from Yosemite.', 1500],
  ['liam', 'mark', 'Coffee tomorrow before class?', 1400],
  ['emma', 'emma', 'Band practice moved to Thursday!', 1300],
  ['noah', 'emma', 'Bringing the new snare drum 🥁', 1250],
  ['olivia', 'olivia', 'finished my first oil painting.', 1100],
  ['mia', 'olivia', 'It looks amazing!!', 1050],
  ['lucas', 'lucas', 'is pitching his startup to investors today.', 900],
  ['diego', 'lucas', '¡Suerte, amigo!', 880],
  ['yusuf', 'omar', 'Happy birthday, brother!', 800],
  ['layla', 'layla', 'New poem up on my blog.', 700],
  ['hana', 'nina', 'Chess club tonight? I’m bringing cake.', 600],
  ['james', 'james', 'won the debate semifinal!', 500],
  ['chloe', 'james', 'Congrats! Can I interview you for the paper?', 480],
  ['ali', 'ali', 'is studying for the math final. Send snacks.', 300],
  ['sofia', 'diego', 'Movie night on Friday?', 200],
  ['ava', 'ava', 'Tennis tournament this weekend 🎾', 120],
  ['mark', 'omar', 'See you at the study group!', 60],
];

// Conversations between friends. Each message: [sender, text, minutes ago, unread?].
// Unread messages are unread for the recipient (the other person in the pair).
export const conversations = [
  { between: ['mark', 'sara'], messages: [
    ['sara', 'Hey! Saw your new site.', 300],
    ['mark', 'Thanks! Tell your friends 😄', 298],
    ['sara', 'Already did. Half my dorm signed up.', 295],
    ['mark', 'No way. The server is going to melt.', 294],
    ['sara', 'Better buy more servers then!', 290],
    ['mark', 'On it.', 289],
  ] },
  { between: ['mark', 'omar'], messages: [
    ['mark', 'Did you finish the algorithms homework?', 180],
    ['omar', 'Almost, stuck on question 4.', 175],
    ['omar', 'Are you coming to the study group tonight?', 12, true],
    ['omar', 'Bring snacks please 🙏', 10, true],
  ] },
  { between: ['mark', 'liam'], messages: [
    ['liam', 'Coffee tomorrow?', 1400],
    ['mark', 'Sure, 9am at the usual place.', 1390],
    ['liam', 'Running 10 min late, sorry!', 5, true],
  ] },
  { between: ['mark', 'james'], messages: [
    ['james', 'Want to come watch the debate final?', 400],
    ['mark', 'Definitely, good luck!', 395],
  ] },
  { between: ['mark', 'chloe'], messages: Array.from({ length: 30 }, (_, i) => [
    i % 2 ? 'mark' : 'chloe',
    i % 2
      ? ['Sure, ask away.', 'Mostly nights and weekends.', 'Next.js and Node.js.', 'About 1,000 users so far.', 'Ha, maybe!'][Math.floor(i / 2) % 5]
      : ['Can I interview you for the student paper?', 'When do you find time to code?', 'What is it built with?', 'How many people use it?', 'Will it be bigger than MySpace?'][Math.floor(i / 2) % 5],
    600 - i * 5,
  ]) },
  { between: ['sara', 'emma'], messages: [
    ['emma', 'Are you coming to our gig on Saturday?', 500],
    ['sara', 'Wouldn’t miss it!', 495],
    ['emma', 'I’ll put you on the guest list.', 490],
    ['sara', 'Can I bring my camera?', 485],
    ['emma', 'Please do, we need band photos!', 480],
  ] },
  { between: ['sara', 'olivia'], messages: [
    ['sara', 'Your painting is gorgeous.', 1000],
    ['olivia', 'Thank you! Want to see the next one?', 990],
    ['olivia', 'Come by the studio tomorrow 🎨', 30, true],
  ] },
  { between: ['omar', 'yusuf'], messages: [
    ['yusuf', 'Marhaba! How is the semester going?', 800],
    ['omar', 'Busy but good. You?', 790],
    ['yusuf', 'Thesis is eating my life.', 785],
    ['omar', 'Hang in there, brother.', 780],
  ] },
  { between: ['omar', 'layla'], messages: [
    ['layla', 'Can you help me with the CS elective?', 650],
    ['omar', 'Sure, library at 6?', 640],
    ['layla', 'Perfect, thanks!', 635],
  ] },
  { between: ['emma', 'noah'], messages: [
    ['noah', 'New snare arrived!', 1250],
    ['emma', 'Finally! Practice Thursday?', 1245],
    ['noah', 'Yes. Tell Liam to bring the amp.', 1240],
    ['emma', 'Will do 🎸', 1235],
  ] },
  { between: ['olivia', 'ava'], messages: [
    ['ava', 'Coming to my tennis match?', 150],
    ['olivia', 'Of course! What time?', 140],
    ['ava', 'Saturday at 10.', 135, true],
  ] },
  { between: ['lucas', 'diego'], messages: [
    ['diego', '¿Cómo fue el pitch?', 870],
    ['lucas', 'They want a second meeting!', 860],
    ['diego', '¡Increíble! Drinks on you then.', 855],
  ] },
  { between: ['diego', 'sofia'], messages: [
    ['sofia', 'Movie night Friday?', 200],
    ['diego', 'Yes! You pick the movie.', 195],
  ] },
  { between: ['layla', 'hana'], messages: [
    ['hana', 'I baked too many cookies.', 400],
    ['layla', 'That is not a problem I’ve ever had.', 395],
    ['hana', 'Come over, I’ll share 🍪', 390],
  ] },
  { between: ['yusuf', 'ali'], messages: [
    ['ali', 'Volleyball on Sunday?', 250],
    ['yusuf', 'Count me in.', 245],
  ] },
  { between: ['chloe', 'james'], messages: [
    ['chloe', 'Thanks for the interview!', 470],
    ['james', 'Anytime. Send me the article.', 465],
  ] },
  { between: ['nina', 'hana'], messages: [
    ['nina', 'Rematch at chess club?', 590],
    ['hana', 'You’re on. I’ll bring cake.', 585, true],
  ] },
];
