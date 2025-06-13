const express = require('express');
const router = express.Router();

let students = require('../data/students');
const { validateStudent } = require('../middleware/validation');

// Generate unique ID
const generateNewId = () => {
    return students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
};

// GET /api/students - Get all students with filters
router.get('/', (req, res) => {
    let filtered = [...students];
    const { active, grade, subject } = req.query;

    if (active !== undefined) {
        const isActive = active === 'true';
        filtered = filtered.filter(s => s.isActive === isActive);
    }

    if (grade) {
        filtered = filtered.filter(s => s.grade === grade.toUpperCase());
    }

    if (subject) {
        filtered = filtered.filter(s =>
            s.subjects.some(sub => sub.toLowerCase() === subject.toLowerCase())
        );
    }

    res.status(200).json({ total: filtered.length, students: filtered });
});

// GET /api/students/stats - Get statistics
router.get('/stats', (req, res) => {
    const total = students.length;
    const activeCount = students.filter(s => s.isActive).length;
    const gradeDist = students.reduce((acc, s) => {
        acc[s.grade] = (acc[s.grade] || 0) + 1;
        return acc;
    }, {});

    res.status(200).json({
        totalStudents: total,
        activeStudents: activeCount,
        gradeDistribution: gradeDist
    });
});

// GET /api/students/search?q=term - Search students
router.get('/search', (req, res) => {
    const searchTerm = req.query.q?.toLowerCase();

    if (!searchTerm) {
        return res.status(400).json({ message: 'Search term "q" is required.' });
    }

    const result = students.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm) ||
        student.lastName.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.subjects.some(sub => sub.toLowerCase().includes(searchTerm))
    );

    res.status(200).json({ count: result.length, students: result });
});

// GET /api/students/grade/:grade - Get students by grade
router.get('/grade/:grade', (req, res) => {
    const grade = req.params.grade.toUpperCase();
    const validGrades = ['A', 'B', 'C', 'D', 'F'];

    if (!validGrades.includes(grade)) {
        return res.status(400).json({ message: 'Invalid grade. Use A–F.' });
    }

    const filtered = students.filter(s => s.grade === grade);
    res.status(200).json({ count: filtered.length, students: filtered });
});

// GET /api/students/:id - Get student by ID
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json(student);
});

// POST /api/students - Create new student
router.post('/', validateStudent, (req, res) => {
    const { firstName, lastName, email, age, grade, subjects = [], isActive = true } = req.body;

    if (students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    const newStudent = {
        id: generateNewId(),
        firstName,
        lastName,
        email,
        age,
        grade: grade.toUpperCase(),
        subjects,
        enrollmentDate: new Date().toISOString().split('T')[0],
        isActive
    };

    students.push(newStudent);
    res.status(201).json({ message: 'Student created successfully', student: newStudent });
});

// PUT /api/students/:id - Update student (partial update)
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Student not found' });
    }

    const update = req.body;
    const student = students[index];

    if (update.firstName !== undefined) {
        if (typeof update.firstName !== 'string' || update.firstName.length < 2 || update.firstName.length > 50) {
            return res.status(400).json({ message: 'Invalid firstName' });
        }
        student.firstName = update.firstName;
    }

    if (update.lastName !== undefined) {
        if (typeof update.lastName !== 'string' || update.lastName.length < 2 || update.lastName.length > 50) {
            return res.status(400).json({ message: 'Invalid lastName' });
        }
        student.lastName = update.lastName;
    }

    if (update.email !== undefined) {
        if (!/^\S+@\S+\.\S+$/.test(update.email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (students.some(s => s.email === update.email && s.id !== id)) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        student.email = update.email;
    }

    if (update.age !== undefined) {
        if (typeof update.age !== 'number' || update.age < 16 || update.age > 100) {
            return res.status(400).json({ message: 'Invalid age' });
        }
        student.age = update.age;
    }

    if (update.grade !== undefined) {
        const validGrades = ['A', 'B', 'C', 'D', 'F'];
        if (!validGrades.includes(update.grade.toUpperCase())) {
            return res.status(400).json({ message: 'Invalid grade' });
        }
        student.grade = update.grade.toUpperCase();
    }

    if (update.subjects !== undefined) {
        if (!Array.isArray(update.subjects)) {
            return res.status(400).json({ message: 'Subjects must be an array' });
        }
        student.subjects = update.subjects;
    }

    if (update.isActive !== undefined) {
        if (typeof update.isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be boolean' });
        }
        student.isActive = update.isActive;
    }

    students[index] = student;
    res.status(200).json({ message: 'Student updated successfully', student });
});

// PUT /api/students/:id/grade - Update only grade
router.put('/:id/grade', (req, res) => {
    const id = parseInt(req.params.id);
    const { grade } = req.body;

    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }

    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!grade || !validGrades.includes(grade.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid grade. Must be A–F.' });
    }

    student.grade = grade.toUpperCase();
    res.status(200).json({ message: 'Student grade updated', student });
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Student not found' });
    }

    const deleted = students.splice(index, 1)[0];
    res.status(200).json({ message: 'Student deleted', student: deleted });
});

// POST /api/students/bulk - Bulk add students
router.post('/bulk', (req, res) => {
    const entries = req.body;

    if (!Array.isArray(entries)) {
        return res.status(400).json({ message: 'Request body must be an array of students.' });
    }

    const success = [];
    const errors = [];

    entries.forEach((s, index) => {
        const { firstName, lastName, email, age, grade } = s;

        if (!firstName || !lastName || !email || !age || !grade) {
            errors.push({ index, message: 'Missing required fields' });
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.push({ index, message: 'Invalid email' });
            return;
        }

        if (students.some(st => st.email.toLowerCase() === email.toLowerCase())) {
            errors.push({ index, message: 'Email already exists' });
            return;
        }

        const newStudent = {
            id: generateNewId(),
            firstName,
            lastName,
            email,
            age,
            grade: grade.toUpperCase(),
            subjects: s.subjects || [],
            enrollmentDate: new Date().toISOString().split('T')[0],
            isActive: true
        };

        students.push(newStudent);
        success.push(newStudent);
    });

    res.status(201).json({
        message: 'Bulk operation completed',
        successCount: success.length,
        errorCount: errors.length,
        addedStudents: success,
        errors
    });
});

router.post('/bulk', (req, res)=>{
    const newStudentsData=req.body;

    if(!Array.isArray(newstudentData)){
        return res.status(400).json({message:'Request body must be an array of students.'});
    }
    const addedStudentsData= [];
    const errors = [];

    newStudentsData.foreach((studentData, index) =>{
        const {firstName , lastName, email, age, grade, }=newStudentsData;

        if (!firstName || !lastName || !email || !age || !grade) {
      errors.push({ index, message: 'Missing required fields' });
      return;
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ index, message: 'Invalid email format' });
      return;
    }

    // ✅ Check for duplicate email
    if (students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      errors.push({ index, message: 'Email already exists' });
      return;
    }

    // ✅ All good: add student
    const newStudent = {
      id: students.length ? Math.max(...students.map(s => s.id)) + 1 : 1,
      firstName,
      lastName,
      email,
      age,
      grade: grade.toUpperCase(),
      subjects: studentData.subjects || [],
      enrollmentDate: new Date().toISOString().split('T')[0],
      isActive: true
    };

    students.push(newStudent);
    addedStudents.push(newStudent);
  });

  res.status(201).json({
    message: 'Bulk operation completed',
    successCount: addedStudents.length,
    addedStudents,
    errorCount: errors.length,
    errors
  });
});
 
router.get('/grade/:grade', (req, res) => {
  const requestedGrade = req.params.grade.toUpperCase();
  const validGrades = ['A', 'B', 'C', 'D', 'F'];

  if (!validGrades.includes(requestedGrade)) {
    return res.status(400).json({ message: 'Invalid grade. Must be A, B, C, D, or F.' });
  }

  const studentsByGrade = students.filter(s => s.grade === requestedGrade);

  res.status(200).json({
    count: studentsByGrade.length,
    students: studentsByGrade
  });
});

router.put('/:id/grade', (req, res) => {
  const studentId = parseInt(req.params.id);
  const { grade } = req.body;

  const student = students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const validGrades = ['A', 'B', 'C', 'D', 'F'];
  if (!grade || !validGrades.includes(grade.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid grade. Must be A, B, C, D, or F.' });
  }

  student.grade = grade.toUpperCase();
  res.status(200).json({ message: 'Student grade updated successfully', student });
});



module.exports = router;
