const express = require('express');
const router = express.Router();
let students = require('../data/students');

// Q1 - GET all students with filters
router.get('/', (req, res) => {
  let result = students;
  const { active, grade, subject } = req.query;

  if (active !== undefined) {
    const isActive = active === 'true';
    result = result.filter(student => student.isActive === isActive);
  }

  if (grade) {
    result = result.filter(student => student.grade === grade.toUpperCase());
  }

  if (subject) {
    result = result.filter(student => 
      student.subjects.some(s => s.toLowerCase() === subject.toLowerCase())
    );
  }

  res.json({ total: result.length, students: result });
});

// Q2 - GET student by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const student = students.find(s => s.id === id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json(student);
});

// Q3 - GET stats
router.get('/stats', (req, res) => {
  const total = students.length;
  const activeCount = students.filter(s => s.isActive).length;

  const gradeCount = students.reduce((acc, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalStudents: total,
    activeStudents: activeCount,
    gradeDistribution: gradeCount
  });
});

module.exports = router;
