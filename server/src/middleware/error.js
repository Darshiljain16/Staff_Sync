export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}` });
  if (err.code === 11000) {
    return res.status(409).json({ message: `${Object.keys(err.keyValue || {})[0] || 'Value'} already exists` });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
