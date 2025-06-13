// middleware/validation.js

function validateStudent(req, res, next) {
  const { firstName, lastName, email, age, grade } = req.body;

  if (
    !firstName || typeof firstName !== 'string' || firstName.length < 2 || firstName.length > 50 ||
    !lastName || typeof lastName !== 'string' || lastName.length < 2 || lastName.length > 50 ||
    !email || !/^\S+@\S+\.\S+$/.test(email) ||
    typeof age !== 'number' || age < 16 || age > 100 ||
    !['A', 'B', 'C', 'D', 'F'].includes(grade?.toUpperCase())
  ) {
    return res.status(400).json({ error: 'Validation failed. Check input fields.' });
  }

  next(); // ✅ Validation passed
}

module.exports = { validateStudent };
