import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// async function seedSecretChats() {
//   console.log('🌱 Seeding secret chats data...');

//   try {
//     // First, let's create some users if they don't exist
//     const users = await Promise.all([
//       prisma.user.upsert({
//         where: { email: 'alice@example.com' },
//         update: {},
//         create: {
//           email: 'alice@example.com',
//           phone: '+1234567890',
//           name: 'Alice Johnson',
//           isVerified: true,
//         },
//       }),
//       prisma.user.upsert({
//         where: { email: 'bob@example.com' },
//         update: {},
//         create: {
//           email: 'bob@example.com',
//           phone: '+1234567891',
//           name: 'Bob Smith',
//           isVerified: true,
//         },
//       }),
//       prisma.user.upsert({
//         where: { email: 'carol@example.com' },
//         update: {},
//         create: {
//           email: 'carol@example.com',
//           phone: '+1234567892',
//           name: 'Carol Davis',
//           isVerified: true,
//         },
//       }),
//     ]);

//     console.log('✅ Users created/updated');

//     // Create a secret chat
//     const secretChat = await prisma.secretChat.create({
//       data: {
//         name: 'Pregnancy Support Group',
//         description: 'A safe space for expecting mothers to share experiences and get support',
//         isGroup: true,
//         createdById: users[0].id,
//         members: {
//           create: [
//             { userId: users[0].id, role: 'ADMIN' },
//             { userId: users[1].id, role: 'MEMBER' },
//             { userId: users[2].id, role: 'MODERATOR' },
//           ],
//         },
//       },
//     });

//     console.log('✅ Secret chat created');

//     // Create some posts
//     const posts = await Promise.all([
//       prisma.post.create({
//         data: {
//           content: 'Hello everyone! Just joined this amazing group. I\'m 20 weeks pregnant and so excited! 🤱',
//           chatId: secretChat.id,
//           authorId: users[0].id,
//           isAnonymous: false,
//         },
//       }),
//       prisma.post.create({
//         data: {
//           content: 'Has anyone experienced severe morning sickness? Looking for natural remedies that actually work...',
//           chatId: secretChat.id,
//           authorId: users[1].id,
//           isAnonymous: true,
//         },
//       }),
//       prisma.post.create({
//         data: {
//           content: 'Sharing some tips for first-time moms! Remember to take it easy and listen to your body. You\'re doing amazing! 💪',
//           chatId: secretChat.id,
//           authorId: users[2].id,
//           isAnonymous: false,
//         },
//       }),
//     ]);

//     console.log('✅ Posts created');

//     // Create some comments
//     await Promise.all([
//       prisma.comment.create({
//         data: {
//           content: 'Congratulations! That\'s so exciting! 🎉',
//           postId: posts[0].id,
//           authorId: users[1].id,
//           isAnonymous: false,
//         },
//       }),
//       prisma.comment.create({
//         data: {
//           content: 'Thank you so much! I can\'t wait to meet my little one!',
//           postId: posts[0].id,
//           authorId: users[0].id,
//           isAnonymous: false,
//         },
//       }),
//       prisma.comment.create({
//         data: {
//           content: 'Try ginger tea and small frequent meals. It really helped me during my pregnancy!',
//           postId: posts[1].id,
//           authorId: users[2].id,
//           isAnonymous: false,
//         },
//       }),
//     ]);

//     console.log('✅ Comments created');

//     // Create some likes
//     await Promise.all([
//       prisma.postLike.create({
//         data: {
//           postId: posts[0].id,
//           userId: users[1].id,
//         },
//       }),
//       prisma.postLike.create({
//         data: {
//           postId: posts[0].id,
//           userId: users[2].id,
//         },
//       }),
//       prisma.postLike.create({
//         data: {
//           postId: posts[2].id,
//           userId: users[0].id,
//         },
//       }),
//     ]);

//     console.log('✅ Post likes created');

//     // Create some messages
//     await Promise.all([
//       prisma.chatMessage.create({
//         data: {
//           content: 'Welcome to our support group! 👋',
//           chatId: secretChat.id,
//           senderId: users[2].id,
//           messageType: 'TEXT',
//         },
//       }),
//       prisma.chatMessage.create({
//         data: {
//           content: 'Thank you! Happy to be here! 😊',
//           chatId: secretChat.id,
//           senderId: users[0].id,
//           messageType: 'TEXT',
//         },
//       }),
//       prisma.chatMessage.create({
//         data: {
//           content: 'If anyone has questions, feel free to ask anytime!',
//           chatId: secretChat.id,
//           senderId: users[2].id,
//           messageType: 'TEXT',
//         },
//       }),
//     ]);

//     console.log('✅ Messages created');

//     // Create another private chat between two users
//     const privateChat = await prisma.secretChat.create({
//       data: {
//         name: null, // Private chats don't need names
//         description: null,
//         isGroup: false,
//         createdById: users[0].id,
//         members: {
//           create: [
//             { userId: users[0].id, role: 'MEMBER' },
//             { userId: users[1].id, role: 'MEMBER' },
//           ],
//         },
//       },
//     });

//     // Add some private messages
//     await Promise.all([
//       prisma.chatMessage.create({
//         data: {
//           content: 'Hey! How are you feeling today?',
//           chatId: privateChat.id,
//           senderId: users[0].id,
//           messageType: 'TEXT',
//         },
//       }),
//       prisma.chatMessage.create({
//         data: {
//           content: 'Much better, thanks for asking! The morning sickness is finally getting better.',
//           chatId: privateChat.id,
//           senderId: users[1].id,
//           messageType: 'TEXT',
//         },
//       }),
//     ]);

//     console.log('✅ Private chat and messages created');

//     console.log('🎉 Secret chats seeding completed successfully!');
//     console.log(`
// 📊 Summary:
// - Created 3 users
// - Created 2 chats (1 group, 1 private)
// - Created 3 posts with comments and likes
// - Created several messages
// - All with proper relationships and permissions

// 🧪 Test the API using:
// - GET /api/v1/secret-chats/test/user/1 (get user's chats)
// - GET /api/v1/secret-chats/${secretChat.id}/posts (get posts)
// - GET /api/v1/secret-chats/${secretChat.id}/messages (get messages)
//     `);

//   } catch (error) {
//     console.error('❌ Error seeding secret chats:', error);
//     throw error;
//   }
// }

// // Run the seed function if this file is executed directly
// if (require.main === module) {
//   seedSecretChats()
//     .catch((e) => {
//       console.error(e);
//       process.exit(1);
//     })
//     .finally(async () => {
//       await prisma.$disconnect();
//     });
// }

// export { seedSecretChats };
