const bcrypt = require('bcryptjs');
const User = require('./User');
const Student = require('./Student');

async function ensureSeedData() {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    const adminPassword = bcrypt.hashSync('Admin@123', 10);
    const admin = await User.create({
      role: 'admin',
      name: 'Super Administrator',
      email: 'admin@portal.com',
      password: adminPassword
    });

    const studentPassword = bcrypt.hashSync('Student@123', 10);
    const user = await User.create({
      role: 'student',
      name: 'Amina Yusuf',
      email: 'amina@portal.com',
      matricNumber: '2024001',
      password: studentPassword
    });

    await Student.create({
      user: user._id,
      name: user.name,
      email: user.email,
      matricNumber: user.matricNumber,
      department: 'Computer Science',
      programme: 'ND Computer Science',
      phone: '08012345678',
      address: 'Kano, Nigeria',
      status: 'Active'
    });

    return { admin, user };
  }

  return null;
}

async function findUserByIdentifier(identifier) {
  const query = identifier.trim().toLowerCase();

  return User.findOne({
    $or: [
      { email: query },
      { matricNumber: query }
    ]
  }).lean();
}

async function getStudents() {
  return Student.find({}).lean();
}

async function getStudentById(id) {
  return Student.findOne({ _id: id }).lean();
}

async function createStudent(payload) {
  const password = payload.password ? bcrypt.hashSync(payload.password, 10) : bcrypt.hashSync('Student@123', 10);
  const user = await User.create({
    role: 'student',
    name: payload.name,
    email: payload.email,
    matricNumber: payload.matricNumber,
    password
  });

  return Student.create({
    user: user._id,
    name: payload.name,
    email: payload.email,
    matricNumber: payload.matricNumber,
    department: payload.department,
    programme: payload.programme,
    phone: payload.phone,
    address: payload.address,
    status: 'Active'
  });
}

async function updateStudent(id, payload) {
  const student = await Student.findById(id);
  if (!student) {
    return null;
  }

  student.name = payload.name;
  student.email = payload.email;
  student.matricNumber = payload.matricNumber;
  student.department = payload.department;
  student.programme = payload.programme;
  student.phone = payload.phone;
  student.address = payload.address;
  await student.save();

  await User.findByIdAndUpdate(student.user, {
    name: payload.name,
    email: payload.email,
    matricNumber: payload.matricNumber,
    password: payload.password ? bcrypt.hashSync(payload.password, 10) : undefined
  });

  return student;
}

async function deleteStudent(id) {
  const student = await Student.findById(id);
  if (!student) {
    return null;
  }

  await User.findByIdAndDelete(student.user);
  await Student.findByIdAndDelete(id);
  return true;
}

async function countStudents() {
  return Student.countDocuments();
}

async function countUsers() {
  return User.countDocuments();
}

module.exports = {
  ensureSeedData,
  findUserByIdentifier,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  countStudents,
  countUsers
};
