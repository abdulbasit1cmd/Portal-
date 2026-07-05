const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/database');
const {
  ensureSeedData,
  findUserByIdentifier,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  countStudents,
  countUsers
} = require('./models/store');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'portal-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }
  })
);

app.locals.siteName = 'Student Portal';

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.redirect('/login');
  }
  next();
}

connectDB()
  .then(() => {
    console.log('MongoDB connected');
    return ensureSeedData();
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });

app.get('/', (req, res) => {
  if (req.session.user) {
    const destination = req.session.user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
    return res.redirect(destination);
  }
  res.render('home', { user: null });
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

app.post('/login', async (req, res) => {
  const identifier = req.body.identifier || '';
  const password = req.body.password || '';
  const user = await findUserByIdentifier(identifier);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { user: req.session.user, error: 'Invalid login details. Please try again.' });
  }

  req.session.user = {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    matricNumber: user.matricNumber || null
  };

  const destination = user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
  res.redirect(destination);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/dashboard', requireAuth, (req, res) => {
  const destination = req.session.user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
  res.redirect(destination);
});

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  const [studentCount, userCount] = await Promise.all([countStudents(), countUsers()]);

  res.render('dashboard', {
    user: req.session.user,
    pageTitle: 'Admin Dashboard',
    studentCount,
    userCount
  });
});

app.get('/admin/students', requireAdmin, async (req, res) => {
  const students = await getStudents();
  res.render('students', {
    user: req.session.user,
    students
  });
});

app.get('/admin/students/new', requireAdmin, (req, res) => {
  res.render('student-form', {
    user: req.session.user,
    student: null,
    action: '/admin/students'
  });
});

app.post('/admin/students', requireAdmin, async (req, res) => {
  await createStudent({
    name: req.body.name,
    email: req.body.email,
    matricNumber: req.body.matricNumber,
    department: req.body.department,
    programme: req.body.programme,
    phone: req.body.phone,
    address: req.body.address,
    password: req.body.password
  });

  res.redirect('/admin/students');
});

app.get('/admin/students/:id/edit', requireAdmin, async (req, res) => {
  const student = await getStudentById(req.params.id);
  if (!student) {
    return res.redirect('/admin/students');
  }

  res.render('student-form', {
    user: req.session.user,
    student,
    action: `/admin/students/${student._id}/update`
  });
});

app.post('/admin/students/:id/update', requireAdmin, async (req, res) => {
  await updateStudent(req.params.id, {
    name: req.body.name,
    email: req.body.email,
    matricNumber: req.body.matricNumber,
    department: req.body.department,
    programme: req.body.programme,
    phone: req.body.phone,
    address: req.body.address,
    password: req.body.password
  });

  res.redirect('/admin/students');
});

app.post('/admin/students/:id/delete', requireAdmin, async (req, res) => {
  await deleteStudent(req.params.id);
  res.redirect('/admin/students');
});

app.get('/student/dashboard', requireStudent, async (req, res) => {
  const student = await getStudentById(req.session.user.id);
  res.render('student-dashboard', {
    user: req.session.user,
    student
  });
});

app.get('/student/profile', requireStudent, async (req, res) => {
  const student = await getStudentById(req.session.user.id);
  res.render('student-dashboard', {
    user: req.session.user,
    student
  });
});

app.use((req, res) => {
  res.status(404).render('home', { user: req.session.user });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Portal app listening on http://localhost:${PORT}`);
  });
}

module.exports = { app };
