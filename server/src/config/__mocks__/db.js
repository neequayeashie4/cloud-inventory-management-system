// Manual mock used by tests/*.test.js via jest.mock("../src/config/db").
// Keeps the entire test suite off a real MySQL connection.
const mockConnection = {
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

const pool = {
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue(mockConnection),
  __mockConnection: mockConnection,
};

module.exports = pool;
