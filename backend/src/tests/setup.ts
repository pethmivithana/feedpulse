import mongoose from 'mongoose';

beforeAll(async () => {
  await mongoose.connect('mongodb+srv://pethmi9:pethmi09@cluster0.furwrbi.mongodb.net/feedpulse_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});